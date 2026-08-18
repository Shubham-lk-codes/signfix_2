const multer=require('multer');
const crypto=require('crypto');
const path=require('path');
const {uploadDir}=require('../../config');
const allowed=new Set(['image/jpeg','image/png','image/webp','image/heic','image/heif']);
const storage=multer.diskStorage({destination:uploadDir,filename:(_,file,cb)=>cb(null,`${Date.now()}-${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase().slice(0,10)}`)});
module.exports=multer({storage,limits:{fileSize:8*1024*1024,files:10},fileFilter:(_,file,cb)=>allowed.has(file.mimetype)?cb(null,true):cb(Object.assign(new Error('Only JPEG, PNG, WebP, HEIC, and HEIF images are allowed'),{status:415}))});
