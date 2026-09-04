const multer=require('multer');
const allowed=new Set(['image/jpeg','image/png','image/webp','image/heic','image/heif']);
module.exports=multer({storage:multer.memoryStorage(),limits:{fileSize:8*1024*1024,files:10},fileFilter:(_,file,cb)=>allowed.has(file.mimetype)?cb(null,true):cb(Object.assign(new Error('Only JPEG, PNG, WebP, HEIC, and HEIF images are allowed'),{status:415}))});
