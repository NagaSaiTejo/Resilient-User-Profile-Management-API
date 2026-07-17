function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message);

  let statusCode = 500;
  let errorCode = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details = [];

  if (err.isJoi) {
    statusCode = 400;
    errorCode = 'INVALID_INPUT';
    message = 'Validation failed';
    details = err.details.map(d => d.message);
  } else if (err.code === 'EMAIL_DUPLICATE') {
    statusCode = 409;
    errorCode = 'EMAIL_DUPLICATE';
    message = 'User with this email already exists';
  } else if (err.status) {
    statusCode = err.status;
    message = err.message;
    errorCode = err.errorCode || 'ERROR';
  } else if (err.message === 'Circuit Breaker is OPEN') {
    statusCode = 503;
    errorCode = 'SERVICE_UNAVAILABLE';
    message = 'External service is currently unavailable';
  }

  res.status(statusCode).json({
    errorCode,
    message,
    details
  });
}

module.exports = errorHandler;
