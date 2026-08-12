function notFound(req, res) { res.status(404).json({ error: `Route ${req.method} ${req.path} was not found` }); }
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : error.status || 500;
  const message = error.code === 'LIMIT_FILE_SIZE' ? 'File exceeds 8 MB' : error.message || 'Unexpected server error';
  res.status(status).json({ error: process.env.NODE_ENV === 'production' && status === 500 ? 'Unexpected server error' : message });
}
module.exports = { notFound, errorHandler };
