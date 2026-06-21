/**
 * Unit tests for input sanitization middleware
 */
const sanitizeInput = require('../../middleware/sanitize');

describe('Sanitize Input Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {}
    };
    res = {};
    next = jest.fn();
  });

  test('Should bypass empty bodies, queries, and params', () => {
    sanitizeInput(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({});
    expect(req.query).toEqual({});
    expect(req.params).toEqual({});
  });

  test('Should escape HTML tags in strings', () => {
    req.body = {
      username: '<script>alert("xss")</script>',
      comment: 'Hello & welcome <world>'
    };

    sanitizeInput(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.body.username).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    expect(req.body.comment).toBe('Hello &amp; welcome &lt;world&gt;');
  });

  test('Should recursively sanitize arrays and nested objects', () => {
    req.body = {
      nested: {
        attack: '<a href="javascript:alert(1)">click</a>'
      },
      tags: ['<b>bold</b>', 123, null]
    };

    sanitizeInput(req, res, next);

    expect(req.body.nested.attack).toBe('&lt;a href=&quot;javascript:alert(1)&quot;&gt;click&lt;&#x2F;a&gt;');
    expect(req.body.tags[0]).toBe('&lt;b&gt;bold&lt;&#x2F;b&gt;');
    expect(req.body.tags[1]).toBe(123);
    expect(req.body.tags[2]).toBeNull();
  });

  test('Should handle null or undefined body gracefully', () => {
    const customReq = {
      body: null,
      query: { xss: '<script>' }
    };
    sanitizeInput(customReq, res, next);
    expect(customReq.body).toBeNull();
    expect(customReq.query.xss).toBe('&lt;script&gt;');
  });

  test('Should handle missing body, query, and params', () => {
    const customReq = {};
    sanitizeInput(customReq, res, next);
    expect(customReq.body).toBeUndefined();
    expect(customReq.query).toBeUndefined();
    expect(customReq.params).toBeUndefined();
  });
});
