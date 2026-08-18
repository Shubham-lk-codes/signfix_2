const {z}=require('zod');

module.exports=z.union([
  z.object({
    latitude:z.coerce.number().finite().min(-90).max(90),
    longitude:z.coerce.number().finite().min(-180).max(180),
    accuracyMeters:z.coerce.number().finite().nonnegative().max(100000).optional()
  }),
  z.object({
    locationError:z.enum(['permission_denied','gps_unavailable','position_unavailable','timeout'])
  })
]);
