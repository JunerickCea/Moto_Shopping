// An error whose message is safe to show the client (see the error handler in app.js).
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

module.exports = { HttpError };
