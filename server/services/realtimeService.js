const {Server}=require('socket.io'),Redis=require('ioredis');
let io,pub,sub;
async function initialize(server,isCorsOriginAllowed){io=new Server(server,{cors:{origin(origin,callback){if(isCorsOriginAllowed(origin))return callback(null,true);
    callback(new Error('Origin is not allowed by CORS'));
},credentials:true}});
io.on('connection',socket=>{socket.on('admin:subscribe',()=>socket.join('admins'));});if(process.env.REDIS_URL){const options={lazyConnect:true,maxRetriesPerRequest:1,enableReadyCheck:true};const candidatePub=new Redis(process.env.REDIS_URL,options),candidateSub=new Redis(process.env.REDIS_URL,options);candidatePub.on('error',()=>{});candidateSub.on('error',()=>{});try{await Promise.all([candidatePub.connect(),candidateSub.connect()]);await candidateSub.subscribe('signfix:ai-events');candidateSub.on('message',(_,raw)=>{try{io.to('admins').emit('ai:update',JSON.parse(raw))}catch{}});pub=candidatePub;sub=candidateSub;}catch(error){candidatePub.disconnect();candidateSub.disconnect();console.warn(`Redis realtime disabled: ${error.message}`);}
}return io;}
async function publish(event,payload){const message={event,payload,at:new Date().toISOString()};if(pub){try{await pub.publish('signfix:ai-events',JSON.stringify(message));return;}catch(error){console.warn(`Redis publish failed: ${error.message}`);}}io?.to('admins').emit('ai:update',message);}
module.exports={initialize,publish};
