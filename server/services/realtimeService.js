const {Server}=require('socket.io'),Redis=require('ioredis');
let io,pub,sub;
async function initialize(server,isCorsOriginAllowed){io=new Server(server,{cors:{origin(origin,callback){if(isCorsOriginAllowed(origin))return callback(null,true);
    callback(new Error('Origin is not allowed by CORS'));
},credentials:true}});
io.on('connection',socket=>{socket.on('admin:subscribe',()=>socket.join('admins'));});if(process.env.REDIS_URL){pub=new Redis(process.env.REDIS_URL);sub=new Redis(process.env.REDIS_URL);await sub.subscribe('signfix:ai-events');sub.on('message',(_,raw)=>{try{io.to('admins').emit('ai:update',JSON.parse(raw))}catch{}});
}return io;}
async function publish(event,payload){const message={event,payload,at:new Date().toISOString()};if(pub)await pub.publish('signfix:ai-events',JSON.stringify(message));else io?.to('admins').emit('ai:update',message);}
module.exports={initialize,publish};
