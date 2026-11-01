import { AppError } from '../utils/AppError.js';

export function validateBody(schema) {
  return (request, _response, next) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      return next(
        new AppError(
          400,
          'VALIDATION_ERROR',
          'Please provide a premise between 20 and 500 characters and valid case options.',
        ),
      );
    }
    request.validatedBody = result.data;
    next();
  };
}
