export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function notFound(req, res) {
  res.status(404).json({ message: '接口不存在' });
}

export function errorHandler(err, req, res, next) {
  const status = err.statusCode || 500;
  const message = status === 500 ? '服务器开小差了' : err.message;
  if (status === 500) console.error(err);
  res.status(status).json({ message });
}
