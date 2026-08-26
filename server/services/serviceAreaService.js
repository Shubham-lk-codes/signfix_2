const jwt=require('jsonwebtoken');
const database=require('../database');
const {jwtSecret,serviceAreaTokenMinutes}=require('../config');

function http(message,status=400,errorCode){return Object.assign(new Error(message),{status,errorCode});}
function distanceKm(aLat,aLng,bLat,bLng){const rad=n=>n*Math.PI/180,R=6371;const dLat=rad(bLat-aLat),dLng=rad(bLng-aLng);const h=Math.sin(dLat/2)**2+Math.cos(rad(aLat))*Math.cos(rad(bLat))*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(h));}
function locationErrorMessage(error){return {permission_denied:'Location permission is required to use services in your area.',gps_unavailable:'GPS is unavailable. Please enable location services and try again.',position_unavailable:'Your current location could not be determined. Please try again.',timeout:'Location lookup timed out. Please try again.'}[error]||'Current location is unavailable.';}
async function validateLocation(latitude,longitude,user){
  const {rows}=await database.getPool().query('SELECT id,name,state,country,latitude::float,longitude::float,radius_km::float AS "radiusKm" FROM allowed_cities WHERE active=TRUE ORDER BY name');
  if(!rows.length){
    if(process.env.NODE_ENV!=='production'){
      const accessToken=jwt.sign({type:'service_area',sub:String(user.id),role:user.role,cityId:'development'},jwtSecret,{expiresIn:`${serviceAreaTokenMinutes}m`});
      return {allowed:true,developmentFallback:true,city:{id:'development',name:'Local development',state:null,country:null},accessToken,expiresInSeconds:serviceAreaTokenMinutes*60};
    }
    throw http('Our service is currently unavailable because no service areas are active.',403,'NO_ACTIVE_SERVICE_AREAS');
  }
  const matches=rows.map(city=>({...city,distanceKm:distanceKm(latitude,longitude,city.latitude,city.longitude)})).filter(city=>city.distanceKm<=city.radiusKm).sort((a,b)=>a.distanceKm-b.distanceKm);
  if(!matches.length)throw http('Our service is currently available only in selected cities. We are not available in your current location yet.',403,'OUTSIDE_SERVICE_AREA');
  const city=matches[0];
  const accessToken=jwt.sign({type:'service_area',sub:String(user.id),role:user.role,cityId:String(city.id)},jwtSecret,{expiresIn:`${serviceAreaTokenMinutes}m`});
  return {allowed:true,city:{id:city.id,name:city.name,state:city.state,country:city.country},accessToken,expiresInSeconds:serviceAreaTokenMinutes*60};
}
function requireServiceArea(req,res,next){
  try{const token=req.headers['x-service-area-token'];if(!token)return res.status(428).json({error:'Current location validation is required',errorCode:'LOCATION_VALIDATION_REQUIRED'});const payload=jwt.verify(token,jwtSecret);if(payload.type!=='service_area'||String(payload.sub)!==String(req.user.id)||payload.role!==req.user.role)throw new Error();req.serviceArea=payload;next();}
  catch(_){return res.status(403).json({error:'Location validation is invalid or expired. Please validate your current location again.',errorCode:'LOCATION_VALIDATION_EXPIRED'});}
}
module.exports={distanceKm,locationErrorMessage,validateLocation,requireServiceArea};
