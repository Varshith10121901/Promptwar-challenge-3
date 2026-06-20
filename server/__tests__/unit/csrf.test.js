/**
 * Unit tests for CSRF protection middleware
 */
const csrfMiddleware = require('../../middleware/csrf');

describe('CSRF Protection Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      method: 'GET',
      headers: {},
      signedCookies: {},
      ip: '127.0.0.1',
      originalUrl: '/api/test'
    };
    res = {
      cookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    next = jest.fn();
  });

  test('Should bypass when in test environment without enforce header', () => {
    // NODE_ENV is set to 'test' by Jest
    csrfMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  test('Should generate and set signed cookie on GET request when enforced', () => {
    req.headers['x-test-csrf-enforce'] = 'true';
    
    csrfMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith(
      '_csrf',
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        signed: true,
        path: '/'
      })
    );
  });

  test('Should reuse existing cookie token if present when enforced', () => {
    req.headers['x-test-csrf-enforce'] = 'true';
    req.signedCookies._csrf = 'existing-csrf-token-123';

    csrfMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  test('Should fail (403) on state-modifying requests without token when enforced', () => {
    req.method = 'POST';
    req.headers['x-test-csrf-enforce'] = 'true';
    req.signedCookies._csrf = 'valid-token';

    csrfMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: expect.stringContaining('CSRF')
      })
    );
  });

  test('Should fail (403) on state-modifying requests with mismatching token when enforced', () => {
    req.method = 'PUT';
    req.headers['x-test-csrf-enforce'] = 'true';
    req.signedCookies._csrf = 'valid-token';
    req.headers['x-csrf-token'] = 'invalid-mismatch-token';

    csrfMiddleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('Should pass on state-modifying requests with matching token when enforced', () => {
    req.method = 'DELETE';
    req.headers['x-test-csrf-enforce'] = 'true';
    req.signedCookies._csrf = 'valid-token';
    req.headers['x-csrf-token'] = 'valid-token';

    csrfMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
