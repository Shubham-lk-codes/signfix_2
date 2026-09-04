const multer=require('multer');
const allowed=new Set(['image/jpeg','image/png','image/webp','application/pdf']);
module.exports=multer({storage:multer.memoryStorage(),limits:{fileSize:8*1024*1024,files:8},fileFilter:(_,file,cb)=>allowed.has(file.mimetype)?cb(null,true):cb(Object.assign(new Error('Only JPEG, PNG, WebP, and PDF design files are allowed'),{status:415}))});
