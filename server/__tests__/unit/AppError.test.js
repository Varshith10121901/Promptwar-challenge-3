/**
 * Unit tests for custom AppError and its subclasses
 */
const { 
  AppError, 
  ValidationError, 
  AuthenticationError, 
  ForbiddenError, 
  NotFoundError, 
  ConflictError 
} = require('../../utils/AppError');

describe('AppError Custom Error Classes', () => {
  test('AppError - Should correctly set properties', () => {
    const error = new AppError('Standard error message', 418, { detail: 'teapot' });
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe('Standard error message');
    expect(error.statusCode).toBe(418);
    expect(error.status).toBe('fail');
    expect(error.isOperational).toBe(true);
    expect(error.errors).toEqual({ detail: 'teapot' });
    expect(error.stack).toBeDefined();
  });

  test('AppError - Status should be fail for 4xx status codes', () => {
    const error = new AppError('Fail message', 400);
    expect(error.status).toBe('fail');
  });

  test('ValidationError - Should default to status 400 and default message', () => {
    const error = new ValidationError();
    expect(error.statusCode).toBe(400);
    expect(error.message).toBe('Validation failed');
    expect(error.status).toBe('fail');
  });

  test('ValidationError - Should accept custom message and errors payload', () => {
    const details = [{ field: 'email', message: 'invalid email' }];
    const error = new ValidationError('Bad Email', details);
    expect(error.message).toBe('Bad Email');
    expect(error.errors).toEqual(details);
  });

  test('AuthenticationError - Should default to status 401 and default message', () => {
    const error = new AuthenticationError();
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Authentication failed');
  });

  test('ForbiddenError - Should default to status 403 and default message', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.message).toBe('Access forbidden');
  });

  test('NotFoundError - Should default to status 404 and default message', () => {
    const error = new NotFoundError();
    expect(error.statusCode).toBe(404);
    expect(error.message).toBe('Resource not found');
  });

  test('ConflictError - Should default to status 409 and default message', () => {
    const error = new ConflictError();
    expect(error.statusCode).toBe(409);
    expect(error.message).toBe('Conflict occurred');
  });
});
