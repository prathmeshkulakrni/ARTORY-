const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for development debugging
  console.error('💥 Express Error Interceptor:', err);

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = new Error(message);
    error.statusCode = 404;
  }

  // Mongoose Duplicate Key Error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `Duplicate field value entered: '${field}'. Please use another value.`;
    error = new Error(message);
    error.statusCode = 400;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new Error(message);
    error.statusCode = 400;
  }

  // JSON Web Token Errors
  if (err.name === 'JsonWebTokenError') {
    error = new Error('Invalid token. Please authenticate again.');
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error = new Error('Token has expired. Please log in again.');
    error.statusCode = 401;
  }

  // SyntaxError (Malformed JSON in request body)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new Error('Invalid JSON format in request body.');
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = errorHandler;
