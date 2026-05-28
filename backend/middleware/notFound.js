// 404 catch-all. Pathless app.use — bare '*' wildcards are invalid in
// Express 5 / path-to-regexp v8.
module.exports = function notFound(req, res) {
  res.status(404).json({
    error: { message: `Not found: ${req.method} ${req.originalUrl}`, code: 'not_found' },
  });
};
