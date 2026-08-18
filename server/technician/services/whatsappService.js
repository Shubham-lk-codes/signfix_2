const database=require('../../database');
const {whatsapp}=require('../../config');

function normalize(number=''){const digits=String(number).replace(/\D/g,'');if(!digits)return '';return digits.length===10?`91${digits}`:digits;}
async function queueOnTheWay(jobId){
  const {rows}=await database.getPool().query(`SELECT j.id,s.ticket_no,u.id AS customer_user_id,u.name AS customer_name,u.mobile,tuser.name AS technician_name,COALESCE(s.service_type,s.category,'service') AS service_name,j.scheduled_at FROM technician_jobs j JOIN service_tickets s ON s.id=j.ticket_id JOIN customers c ON c.id=s.customer_id JOIN users u ON u.id=c.user_id JOIN technicians t ON t.id=j.technician_id JOIN users tuser ON tuser.id=t.user_id WHERE j.id=$1`,[jobId]);
  const item=rows[0];if(!item)return;
  const eta=item.scheduled_at?` Estimated arrival: ${new Date(item.scheduled_at).toLocaleString('en-IN',{timeZone:'Asia/Kolkata'})}.`:'';
  const message=`Hello ${item.customer_name}, your technician ${item.technician_name} is on the way for your ${item.service_name} request. Request ID: ${item.ticket_no}.${eta} Please be available at the service location.`;
  const recipient=normalize(item.mobile);
  const inserted=await database.getPool().query(`INSERT INTO whatsapp_notification_logs(job_id,customer_user_id,event_key,recipient,message,status) VALUES($1,$2,'technician_on_the_way',$3,$4,'pending') ON CONFLICT(job_id,event_key) DO NOTHING RETURNING id`,[jobId,item.customer_user_id,recipient,message]);
  if(!inserted.rowCount)return;
  const logId=inserted.rows[0].id;
  if(!recipient||!whatsapp.accessToken||!whatsapp.phoneNumberId){await database.getPool().query(`UPDATE whatsapp_notification_logs SET status='skipped',error_message=$2,attempted_at=NOW() WHERE id=$1`,[logId,!recipient?'Customer mobile number is unavailable':'WhatsApp provider is not configured']);return;}
  try{const response=await fetch(`https://graph.facebook.com/${whatsapp.apiVersion}/${whatsapp.phoneNumberId}/messages`,{method:'POST',headers:{Authorization:`Bearer ${whatsapp.accessToken}`,'Content-Type':'application/json'},body:JSON.stringify({messaging_product:'whatsapp',recipient_type:'individual',to:recipient,type:'text',text:{preview_url:false,body:message}})});const body=await response.json();if(!response.ok)throw new Error(body?.error?.message||`WhatsApp API returned ${response.status}`);await database.getPool().query(`UPDATE whatsapp_notification_logs SET status='sent',provider_message_id=$2,attempted_at=NOW() WHERE id=$1`,[logId,body.messages?.[0]?.id]);}
  catch(error){await database.getPool().query(`UPDATE whatsapp_notification_logs SET status='failed',error_message=$2,attempted_at=NOW() WHERE id=$1`,[logId,String(error.message).slice(0,1000)]);}
}
module.exports={queueOnTheWay};
