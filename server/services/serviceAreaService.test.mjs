import {describe,expect,it,vi} from 'vitest';
vi.mock('../database.js',()=>({default:{}}));
const {distanceKm}=await import('./serviceAreaService.js');

describe('service area distance',()=>{
  it('returns zero for identical coordinates',()=>expect(distanceKm(28.6139,77.209,28.6139,77.209)).toBe(0));
  it('uses geographic distance for city radius checks',()=>expect(distanceKm(28.6139,77.209,28.7041,77.1025)).toBeGreaterThan(10));
});
