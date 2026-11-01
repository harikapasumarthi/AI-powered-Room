import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

export function originGuard(request, _response, next) {
  const mutating = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(request.method);
  const origin = request.get('origin');
  if (mutating && origin && origin !== env.CLIENT_URL) {
    return next(new AppError(403, 'ORIGIN_NOT_ALLOWED', 'This request origin is not allowed.'));
  }
  next();
}
