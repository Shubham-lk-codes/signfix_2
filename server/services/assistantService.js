const crypto = require("crypto");
const database = require("../database");
const provider = require("./ai/provider");
const pool = () => database.getPool();

async function contextFor(userId) {
  const [catalog, services, customer] = await Promise.all([
    pool().query("SELECT name,category,description FROM products WHERE status=TRUE ORDER BY id LIMIT 40"),
    pool().query("SELECT name FROM service_categories WHERE status=TRUE ORDER BY id LIMIT 40"),
    pool().query(`SELECT c.id,(SELECT COALESCE(jsonb_agg(x),'[]') FROM (SELECT order_no,status,estimated_price FROM orders WHERE customer_id=c.id ORDER BY id DESC LIMIT 8)x) orders,(SELECT COALESCE(jsonb_agg(x),'[]') FROM (SELECT q.quotation_no,q.status,q.final_amount,q.valid_until FROM quotations q JOIN orders o ON o.id=q.order_id WHERE o.customer_id=c.id ORDER BY q.id DESC LIMIT 8)x) quotations,(SELECT COALESCE(jsonb_agg(x),'[]') FROM (SELECT ticket_no,status,category FROM service_tickets WHERE customer_id=c.id ORDER BY id DESC LIMIT 8)x) services FROM customers c WHERE c.user_id=$1`,[userId]),
  ]);
  return { products: catalog.rows, serviceCategories: services.rows, customer: customer.rows[0] || null };
}

async function chat(userId, message, conversationId) {
  const client = await pool().connect(); let conversation;
  try { await client.query("BEGIN");
    if (conversationId) conversation=(await client.query("SELECT id,user_id FROM ai_conversations WHERE id=$1 AND user_id=$2 FOR UPDATE",[conversationId,userId])).rows[0];
    if (!conversation) conversation=(await client.query("INSERT INTO ai_conversations(user_id,question,response,metadata) VALUES($1,$2,'','{}'::jsonb) RETURNING id,user_id",[userId,message])).rows[0];
    await client.query("INSERT INTO ai_messages(conversation_id,role,content) VALUES($1,'user',$2)",[conversation.id,message]); await client.query("COMMIT");
  } catch(e){await client.query("ROLLBACK");throw e;} finally{client.release();}
  const [context,history,settings] = await Promise.all([
    contextFor(userId),
    pool().query("SELECT role,content FROM ai_messages WHERE conversation_id=$1 ORDER BY id DESC LIMIT 20",[conversation.id]),
    pool().query("SELECT value FROM ai_settings WHERE key='assistant_config'"),
  ]);
  const config=settings.rows[0]?.value||{}, guardrails=`You are the SignFix customer assistant. Answer using the supplied SignFix catalog and the authenticated customer's records. Never change data or claim to change it. Never set or negotiate official prices, approve quotations, confirm payments, change order/job state, or perform privileged actions. Calculator values are estimates; only an admin-approved quotation is official. Ask for human support when uncertain, for emergencies, disputes, or privileged requests. Identify a lead only when the customer expresses concrete buying intent or requests a quote and provides a meaningful signage requirement. Do not invent contact details or budget.`;
  const messages=[{role:"developer",content:`SignFix context: ${JSON.stringify(context)}\nSupport configuration: ${JSON.stringify(config)}`},...history.rows.reverse().map(x=>({role:x.role,content:x.content}))];
  const result=await provider.respond({instructions:guardrails,messages,safetyIdentifier:crypto.createHash("sha256").update(String(userId)).digest("hex")});
  const tx=await pool().connect();let lead=null;
  try{await tx.query("BEGIN");await tx.query("INSERT INTO ai_messages(conversation_id,role,content,provider_message_id,metadata) VALUES($1,'assistant',$2,$3,$4::jsonb)",[conversation.id,result.reply,result.providerResponseId,JSON.stringify({provider:result.provider,usage:result.usage})]);await tx.query("UPDATE ai_conversations SET question=$2,response=$3,escalation_status=$4,metadata=metadata||$5::jsonb WHERE id=$1",[conversation.id,message,result.reply,result.requiresHuman?"requested":"none",JSON.stringify({provider:result.provider,providerResponseId:result.providerResponseId})]);if(result.requiresHuman)await tx.query("INSERT INTO support_escalations(conversation_id,user_id,reason) SELECT $1,$2,$3 WHERE NOT EXISTS(SELECT 1 FROM support_escalations WHERE conversation_id=$1 AND status='open')",[conversation.id,userId,message]);if(result.lead?.requirement){const customer=(await tx.query("SELECT id FROM customers WHERE user_id=$1",[userId])).rows[0];lead=(await tx.query("INSERT INTO ai_leads(customer_id,conversation_id,requirement,product,estimated_budget,contact,metadata) VALUES($1,$2,$3,$4,$5,$6,$7::jsonb) RETURNING id,status",[customer?.id||null,conversation.id,result.lead.requirement,result.lead.product,result.lead.estimatedBudget,result.lead.contact,JSON.stringify({source:"assistant"})])).rows[0];}await tx.query("COMMIT");}catch(e){await tx.query("ROLLBACK");throw e;}finally{tx.release();}
  return {conversationId:conversation.id,reply:result.reply,requiresHuman:result.requiresHuman,lead,provider:result.provider};
}
async function conversations(userId){const rows=(await pool().query(`SELECT c.id,c.escalation_status AS "escalationStatus",c.created_at AS "createdAt",COALESCE(jsonb_agg(jsonb_build_object('id',m.id,'role',m.role,'content',m.content,'createdAt',m.created_at) ORDER BY m.id) FILTER(WHERE m.id IS NOT NULL),'[]') messages FROM ai_conversations c LEFT JOIN ai_messages m ON m.conversation_id=c.id WHERE c.user_id=$1 GROUP BY c.id ORDER BY c.id DESC`,[userId])).rows;return{data:rows};}
module.exports={chat,conversations,contextFor};
