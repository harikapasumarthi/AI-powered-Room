import { isDatabaseConnected } from '../config/database.js';
import { AppError } from '../utils/AppError.js';

export function requireDatabase(_request, _response, next) {
  if (!isDatabaseConnected()) {
    return next(new AppError(503, 'DATABASE_UNAVAILABLE', 'The database is temporarily unavailable.'));
  }
  next();
}
