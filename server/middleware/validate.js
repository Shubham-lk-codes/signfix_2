const validate = (schema) => (req, res, next) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ error: 'Validation failed', details: parsed.error.flatten().fieldErrors });
  req.body = parsed.data;
  next();
};
module.exports = validate;
