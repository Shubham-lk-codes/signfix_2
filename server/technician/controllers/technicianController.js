const repo=require('../repositories/technicianRepository'); // technician-owned data access
const service=require('../services/technicianService');

async function dashboard(req,res){res.json({data:await repo.dashboardStats(req.user)});}
async function profile(req,res){const data=await repo.getProfile(req.user.id);if(!data)return res.status(404).json({error:'Technician profile not found'});res.json({data});}
async function updateProfile(req,res){res.json({data:await repo.updateProfile(req.user.id,req.body)});}
async function listJobs(req,res){res.json({data:await repo.listJobs(req.user,req.validatedQuery)});}
async function getJob(req,res){res.json({data:await service.ownedJob(req.params.jobId,req.user)});}
async function updateStatus(req,res){res.json({data:await service.updateStatus(req.params.jobId,req.body.status,req.body.notes,req.user)});}
async function addEvidence(req,res){res.status(201).json({data:await service.addEvidence(req.params.jobId,req.files,req.body,req.user)});}
async function addMaterial(req,res){res.status(201).json({data:await service.addMaterial(req.params.jobId,req.body,req.user)});}
async function shareLocation(req,res){res.status(201).json({data:await service.shareLocation(req.params.jobId,req.body,req.user)});}
async function requestOtp(req,res){res.status(201).json({data:await service.requestCompletionOtp(req.params.jobId,req.user)});}
async function confirm(req,res){res.json({data:await service.confirmCompletion(req.params.jobId,req.body,req.user)});}
module.exports={dashboard,profile,updateProfile,listJobs,getJob,updateStatus,addEvidence,addMaterial,shareLocation,requestOtp,confirm};
