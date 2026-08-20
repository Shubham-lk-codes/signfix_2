const repo=require('../repositories/customerRepository');
const {simplePdf}=require('../../utils/pdf');
async function dashboard(req,res){
    res.json(await repo.dashboard(req.user.id));}
async function orderOptions(req,res){res.json(await repo.orderOptions());}
async function serviceOptions(req,res){res.json(await repo.serviceOptions());}
async function profile(req,res){
    res.json(await repo.profile(req.user.id));

}
async function updateProfile(req,res){
    res.json( await repo.updateProfile(req.user.id,req.body));
}
async function orders(req,res){res.json(await repo.orders(req.user.id,req.query));}
async function services(req,res){res.json(await repo.services(req.user.id,req.query));}
async function addAddress(req,res){res.status(201).json(await repo.addAddress(req.user.id,req.body));}
async function deleteAddress(req,res){await repo.deleteAddress(req.user.id,req.params.id);res.status(204).end();}
async function order(req,res){res.json(await repo.order(req.user.id,req.params.id));}
async function quotations(req,res){res.json({data:await repo.quotations(req.user.id)});}
async function quotation(req,res){res.json(await repo.quotation(req.user.id,req.params.id));}
async function quotationAction(req,res){res.json(await repo.quotationAction(req.user.id,req.params.id,req.body.action,req.body.notes));

}
async function quotationPdf(req,res){const q=await repo.quotation(req.user.id,req.params.id);const product=q.productDetails||{};const lines=[`Quotation: ${q.quotationNo}`,`Order: ${q.orderNo}`,`Product: ${product.product||'-'}`,`Dimensions: ${product.length||'-'} x ${product.width||'-'} ${product.unit||''}`,`Material: ${product.material||'-'}`,`Lighting: ${product.lighting||'-'}`,`Quantity: ${q.quantity||'-'}`,...q.items.map(item=>`${item.description}: ${item.quantity} x INR ${item.unitPrice} = INR ${item.amount}`),`Subtotal: INR ${q.subtotal||0}`,`Installation: INR ${q.installation||0}`,`Transportation: INR ${q.transportation||0}`,`Discount: INR ${q.discount||0}`,`GST (${q.gstRate||0}%): INR ${q.gst||0}`,`Final amount: INR ${q.finalAmount}`,`Validity: ${q.validUntil||'-'}`,`Terms: ${q.terms||'-'}`];res.set({'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${q.quotationNo}.pdf"`,'Cache-Control':'private, no-store'}).send(simplePdf('SignFix Quotation',lines));}
async function serviceTracking(req,res){res.json(await repo.serviceTracking(req.user.id,req.params.id));}
async function notifications(req,res){res.json({data:await repo.notifications(req.user.id)});}
function notificationConfig(req,res){res.json({pushConfigured:require('../../services/firebaseService').isConfigured(),events:['order.submitted','quotation.generated','quotation.updated','order.approved','order.production_started','order.ready','service.technician_assigned','service.technician_on_the_way','service.technician_reached','service.work_started','service.work_completed','service.completed']});}
async function registerNotificationDevice(req,res){res.status(201).json(await repo.registerNotificationDevice(req.user.id,req.body));}
async function unregisterNotificationDevice(req,res){res.json(await repo.unregisterNotificationDevice(req.user.id,req.body.token));}
async function readNotification(req,res){res.json(await repo.readNotification(req.user.id,req.params.id));}
async function createDesign(req,res){res.status(201).json(await repo.createDesign(req.user.id,req.body));}
async function design(req,res){res.json(await repo.design(req.user.id,req.params.id));}
async function generateDesign(req,res){res.status(202).json(await repo.generateDesign(req.user.id,req.params.id,req.body.prompt));}
async function designAction(req,res){res.json(await repo.updateDesign(req.user.id,req.params.id,req.body.action,req.body.notes));}
const requirementFields=['businessType','length','width','location','material','lighting','installation'];
function aiConfig(req,res){res.json({name:'SignFix AI Assistant',capabilities:['product_questions','sign_board_types','materials','ordering_guidance','pricing_calculator','service_requests','order_status','quotations','sales_leads','product_recommendations','requirements_collection','human_escalation'],requirementFields:[...requirementFields,'signType','unit','budget'],optionalFields:['budget'],actions:[{key:'CALCULATE_PRICE',label:'Calculate Price'},{key:'REQUEST_DESIGN',label:'Request Design'},{key:'TALK_TO_SUPPORT',label:'Talk to Support'}],guardrails:['Estimated prices are not final commercial quotations.','The assistant cannot approve quotations.','Production feasibility and delivery dates require Admin confirmation.']});}
function nextRequirement(missing){const questions={businessType:'What type of business is the sign for?',length:'What is the approximate width or length of the sign?',width:'What is the approximate height of the sign?',location:'Where will the sign be installed?',material:'Do you have a preferred material?',lighting:'Would you like no lighting, LED, backlit, neon, front lit, or custom lighting?',installation:'Do you need SignFix installation?'};return missing.length?questions[missing[0]]:'Would you like to create an estimated quotation?';}
function makeReply(message,missing){if(/human|support|agent|escalat/i.test(message))return 'I have created a request for human support. A support agent can review this conversation.';if(/service|repair|damage|problem/i.test(message))return 'I can help create a service request. Please share photos, the problem category, location, and remarks.';if(/price|cost|quotation/i.test(message))return 'I can help calculate an Estimated Price. Final commercial quotations require Admin review and approval.';if(/shop|front|sign|board/i.test(message))return `Sure. I can help you choose one. ${nextRequirement(missing)}`;return nextRequirement(missing);}
async function aiChat(req,res){let reply,sources=[];const requirements=req.body.requirements||{},missingRequirements=requirementFields.filter(field=>requirements[field]===undefined||requirements[field]===''),readyForEstimate=missingRequirements.length===0,escalate=/human|support|agent|escalat|emergency|unsafe/i.test(req.body.message);try{if(process.env.OPENAI_API_KEY){const settings=(await require('../../database').getPool().query("SELECT value FROM ai_settings WHERE key='assistant_config'")).rows[0]?.value||{},context=`Customer requirements: ${JSON.stringify(requirements)}. Missing required details: ${missingRequirements.join(', ')||'none'}. ${req.body.message}`,answer=await require('../../services/aiPlatform').answer(context,settings);reply=answer.reply;sources=answer.sources;}else reply=makeReply(req.body.message,missingRequirements);}catch(_){reply=makeReply(req.body.message,missingRequirements);}const metadata={requirements,missingRequirements,readyForEstimate,escalated:escalate};const saved=await repo.saveConversation(req.user.id,req.body.message,reply,escalate,metadata);await require('../../services/realtimeService').publish('conversation.created',{id:saved.id,escalate});res.json({...saved,name:'SignFix AI Assistant',reply,sources,collectedRequirements:requirements,missingRequirements,readyForEstimate,nextQuestion:escalate?null:nextRequirement(missingRequirements),actions:[{key:'CALCULATE_PRICE',label:'Calculate Price',enabled:readyForEstimate},{key:'REQUEST_DESIGN',label:'Request Design',enabled:Boolean(requirements.businessType||requirements.signType)},{key:'TALK_TO_SUPPORT',label:'Talk to Support',enabled:true}],disclaimer:'AI guidance is informational. The assistant cannot approve final commercial quotations or promise production feasibility or delivery dates; Admin confirmation is required.'});}
async function conversations(req,res){res.json({data:await repo.conversations(req.user.id)});
}
async function createLead(req,res){res.status(201).json(await repo.createLead(req.user.id,req.body));

}
module.exports={dashboard,orderOptions,serviceOptions,profile,updateProfile,orders,services,addAddress,deleteAddress,order,quotations,quotation,quotationAction,quotationPdf,serviceTracking,notifications,notificationConfig,registerNotificationDevice,unregisterNotificationDevice,readNotification,createDesign,design,generateDesign,designAction,aiConfig,aiChat,conversations,createLead};
