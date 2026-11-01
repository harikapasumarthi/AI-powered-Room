import { ZodError } from 'zod';
import { AppError } from '../utils/AppError.js';

export function notFoundHandler(_request, _response, next) {
  next(new AppError(404, 'NOT_FOUND', 'The requested resource was not found.'));
}

export function errorHandler(error, _request, response, _next) {
  if (response.headersSent) return;

  let status = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Something went wrong. Please try again.';

  if (error instanceof AppError) {
    status = error.status;
    code = error.code;
    message = error.message;
  } else if (error instanceof ZodError) {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'Please check the submitted information and try again.';
  } else if (error?.type === 'entity.too.large') {
    status = 413;
    code = 'REQUEST_TOO_LARGE';
    message = 'The request is too large.';
  } else if (error?.name === 'ValidationError' || error?.name === 'CastError') {
    status = 400;
    code = 'VALIDATION_ERROR';
    message = 'The submitted information is invalid.';
  }

  if (status >= 500 && process.env.NODE_ENV !== 'test') {
    process.stderr.write(`${error?.name || 'Error'}: ${error?.message || 'unknown error'}\n`);
  }

  response.status(status).json({ success: false, error: { code, message } });
}
