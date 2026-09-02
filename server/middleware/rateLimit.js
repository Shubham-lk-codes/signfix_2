const attempts = new Map();
module.exports = function rateLimit({ windowMs=15*60*1000, max=30 }={}) {
  return (req,res,next) => {
    const key=`${req.ip}:${req.path}`,now=Date.now(),entry=attempts.get(key);
    // Bound memory usage for long-running processes without adding a timer that
    // keeps test and serverless processes alive.
    if(attempts.size>10000)for(const [candidate,value] of attempts)if(value.resetAt<=now)attempts.delete(candidate);
    if(!entry||entry.resetAt<=now){attempts.set(key,{count:1,resetAt:now+windowMs});return next();}
    entry.count+=1;
    res.setHeader('RateLimit-Limit',max);res.setHeader('RateLimit-Remaining',Math.max(0,max-entry.count));
    if(entry.count>max)return res.status(429).json({error:'Too many requests. Please try again later.'});
    next();
  };
};
