const router=require('express').Router();
const crypto=require('crypto');
const database=require('../database');
const rateLimit=require('../middleware/rateLimit');

function safeEqual(a,b){const left=Buffer.from(a||'','utf8'),right=Buffer.from(b||'','utf8');return left.length===right.length&&crypto.timingSafeEqual(left,right);}
router.post('/webhook',rateLimit({windowMs:60*1000,max:120}),async(req,res)=>{
  const secret=process.env.PAYMENT_WEBHOOK_SECRET;
  if(!secret)return res.status(503).json({error:'Payment webhook is not configured'});
  const expected=crypto.createHmac('sha256',secret).update(req.rawBody||Buffer.from(JSON.stringify(req.body))).digest('hex');
  if(!safeEqual(req.headers['x-signfix-signature'],expected))return res.status(401).json({error:'Invalid webhook signature'});
  const {eventId,provider='unknown',type,reference,providerPaymentId,amount}=req.body;
  if(!eventId||!type||!reference)return res.status(422).json({error:'eventId, type, and reference are required'});
  const client=await database.getPool().connect();
  try{await client.query('BEGIN');const inserted=await client.query(`INSERT INTO payment_webhook_events(provider,event_id,payload) VALUES($1,$2,$3::jsonb) ON CONFLICT(provider,event_id) DO NOTHING RETURNING id`,[provider,eventId,JSON.stringify(req.body)]);if(!inserted.rowCount){await client.query('ROLLBACK');return res.json({received:true,duplicate:true});}
    const status={payment_authorized:'authorized',payment_captured:'captured',payment_failed:'failed',refund_processed:'partially_refunded'}[type];if(!status)throw Object.assign(new Error('Unsupported payment webhook event'),{status:422});
    const result=await client.query(`UPDATE payments SET status=CASE WHEN $2='refund_processed' AND refunded_amount+COALESCE($5,0)>=amount THEN 'refunded' ELSE $3 END,provider=$4,provider_payment_id=COALESCE($6,provider_payment_id),refunded_amount=CASE WHEN $2='refund_processed' THEN refunded_amount+COALESCE($5,0) ELSE refunded_amount END,captured_at=CASE WHEN $2='payment_captured' THEN NOW() ELSE captured_at END,verified_at=NOW(),updated_at=NOW() WHERE reference=$1 RETURNING id`,[reference,type,status,provider,amount,providerPaymentId]);if(!result.rowCount)throw Object.assign(new Error('Payment reference not found'),{status:404});await client.query('COMMIT');res.json({received:true,paymentId:result.rows[0].id,status});
  }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();}
});
module.exports=router;
