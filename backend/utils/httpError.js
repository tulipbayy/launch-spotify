// Typed error carrying an HTTP status + optional machine-readable code.
// Throw these from services/controllers; errorHandler turns them into JSON.
class HttpError extends Error {
  constructor(status, message, code = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
  }
}

module.exports = HttpError;
