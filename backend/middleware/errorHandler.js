// Centralized error handler. Must be mounted last (4-arg signature).
module.exports = function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    error: {
      message: err.message || 'Internal server error',
      code: err.code || null,
    },
  });
};
