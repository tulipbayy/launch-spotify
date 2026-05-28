// Wraps an async route handler so rejected promises are forwarded to next().
// Required on Express 5, where async rejections are not reliably auto-caught.
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
