const repo=require('../repositories/customerRepository');
const {simplePdf}=require('../../utils/pdf');
async function dashboard(req,res){
    res.json(await repo.dashboard(req.user.id));}
async function profile(req,res){
    res.json(await repo.profile(req.user.id));

}
async function updateProfile(req,res){
    res.json( await repo.updateProfile(req.user.id,req.body));
}
async function addAddress(req,res){res.status(201).json(await repo.addAddress(req.user.id,req.body));}
async function deleteAddress(req,res){await repo.deleteAddress(req.user.id,req.params.id);res.status(204).end();}
async function order(req,res){res.json(await repo.order(req.user.id,req.params.id));}
async function quotations(req,res){res.json({data:await repo.quotations(req.user.id)});}
async function quotation(req,res){res.json(await repo.quotation(req.user.id,req.params.id));}
async function quotationAction(req,res){res.json(await repo.quotationAction(req.user.id,req.params.id,req.body.action,req.body.notes));

}
async function quotationPdf(req,res){const q=await repo.quotation(req.user.id,req.params.id);const lines=[`Quotation: ${q.quotationNo}`,`Order: ${q.orderNo}`,`Quantity: ${q.productDetails?.quantity||'-'}`,`Subtotal: INR ${q.subtotal||0}`,`Discount: INR ${q.discount||0}`,`GST: INR ${q.gst||0}`,`Final amount: INR ${q.finalAmount}`,`Validity: ${q.validUntil||'-'}`,`Terms: ${q.terms||'-'}`];res.set({'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="${q.quotationNo}.pdf"`}).send(simplePdf('SignFix Quotation',lines));}
async function serviceTracking(req,res){res.json(await repo.serviceTracking(req.user.id,req.params.id));}
async function notifications(req,res){res.json({data:await repo.notifications(req.user.id)});}
async function readNotification(req,res){res.json(await repo.readNotification(req.user.id,req.params.id));}
async function createDesign(req,res){res.status(201).json(await repo.createDesign(req.user.id,req.body));}
async function designAction(req,res){res.json(await repo.updateDesign(req.user.id,req.params.id,req.body.action,req.body.notes));}
function makeReply(message){if(/human|support|agent|escalat/i.test(message))return 'I have created a request for human support. A support agent can review this conversation.';if(/service|repair|damage|problem/i.test(message))return 'I can help create a service request. Please share photos, the problem category, location, and remarks.';if(/price|cost|quotation/i.test(message))return 'The calculator provides an Estimated Price. Final commercial quotation requires Admin review and approval.';if(/shop|front|sign|board/i.test(message))return 'Sure. What is your business type, approximate width and height, location, preferred material and lighting, and do you need installation?';return 'Please share your business type, sign size, location, preferred material, lighting, optional budget, and installation requirement.';}
async function aiChat(req,res){let reply,sources=[];const escalate=/human|support|agent|escalat|emergency|unsafe/i.test(req.body.message);try{if(process.env.OPENAI_API_KEY){const settings=(await require('../../database').getPool().query("SELECT value FROM ai_settings WHERE key='assistant_config'")).rows[0]?.value||{},answer=await require('../../services/aiPlatform').answer(req.body.message,settings);reply=answer.reply;sources=answer.sources;}else reply=makeReply(req.body.message);}catch(_){reply=makeReply(req.body.message);}const saved=await repo.saveConversation(req.user.id,req.body.message,reply,escalate);await require('../../services/realtimeService').publish('conversation.created',{id:saved.id,escalate});res.json({...saved,name:'SignFix AI Assistant',reply,sources,actions:['Calculate Price','Request Design','Talk to Support'],disclaimer:'AI guidance and designs are concepts only. Final quotation, feasibility and delivery dates require Admin approval.'});}
async function conversations(req,res){res.json({data:await repo.conversations(req.user.id)});
}
async function createLead(req,res){res.status(201).json(await repo.createLead(req.user.id,req.body));

}
module.exports={dashboard,profile,updateProfile,addAddress,deleteAddress,order,quotations,quotation,quotationAction,quotationPdf,serviceTracking,notifications,readNotification,createDesign,designAction,aiChat,conversations,createLead};
