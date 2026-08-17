import {describe,it,expect} from 'vitest';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const schemas=require('./technicianSchemas.js');
const {nextStatus}=require('../services/technicianService.js');

describe('technician API validation',()=>{
  it('accepts valid GPS coordinates and rejects invalid ones',()=>{
    expect(schemas.location.safeParse({latitude:12.97,longitude:77.59}).success).toBe(true);
    expect(schemas.location.safeParse({latitude:91,longitude:77.59}).success).toBe(false);
  });
  it('requires explicit acceptance and an OTP or signature',()=>{
    expect(schemas.confirmation.safeParse({accepted:true,customerName:'Asha',otp:'123456'}).success).toBe(true);
    expect(schemas.confirmation.safeParse({accepted:true,customerName:'Asha'}).success).toBe(false);
  });
  it('defines every technician transition up to completed work',()=>{
    expect(nextStatus).toEqual({assigned:'accepted',accepted:'on_the_way',on_the_way:'reached_location',reached_location:'inspection_started',inspection_started:'work_in_progress',work_in_progress:'completed'});
  });
  it('limits page size and validates ISO dates',()=>{
    expect(schemas.jobQuery.safeParse({limit:'100',from:'2026-08-17'}).success).toBe(true);
    expect(schemas.jobQuery.safeParse({limit:'101',from:'17-08-2026'}).success).toBe(false);
  });
});
