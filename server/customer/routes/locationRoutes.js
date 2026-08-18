const router=require('express').Router();const validate=require('../../middleware/validate');const locationSchema=require('../../validation/locationSchema');const controller=require('../controllers/locationController');const {authenticate,authorize}=require('../../middleware/auth');
router.post('/validate',authenticate,authorize('customer'),validate(locationSchema),controller.validate);
module.exports=router;
