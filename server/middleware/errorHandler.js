function failure(res, status, message, errorCode) { return res.status(status).json({ success: false, message, error: message, errorCode }); }
function notFound(req, res) { failure(res, 404, `Route ${req.method} ${req.path} was not found`, 'ROUTE_NOT_FOUND'); }
function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : error.status || 500;
  const message = error.code === 'LIMIT_FILE_SIZE' ? 'File exceeds 8 MB' : error.message || 'Unexpected server error';
  const safeMessage = process.env.NODE_ENV === 'production' && status === 500 ? 'Unexpected server error' : message;
  failure(res, status, safeMessage, error.errorCode || (status === 500 ? 'INTERNAL_ERROR' : 'REQUEST_FAILED'));
}
module.exports = { notFound, errorHandler };
