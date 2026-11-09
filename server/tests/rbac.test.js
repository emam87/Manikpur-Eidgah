import test from 'node:test';
import assert from 'node:assert/strict';
import { requireRole } from '../src/middleware/auth.middleware.js';

test('rbac: ADMIN can access ADMIN-only endpoints', () => {
  const req = {
    user: { id: 1, email: 'admin@manikpureidgah.org', role: 'ADMIN' },
  };
  let statusCode = null;
  let responseBody = null;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  const middleware = requireRole('ADMIN');
  middleware(req, res, next);

  assert.equal(nextCalled, true, 'Next must be called for ADMIN on admin-only route');
  assert.equal(statusCode, null);
});

test('rbac: EDITOR is forbidden from ADMIN-only actions (users, purge trash, documents delete)', () => {
  const req = {
    user: { id: 2, email: 'editor@manikpureidgah.org', role: 'EDITOR' },
  };
  let statusCode = null;
  let responseBody = null;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseBody = data;
      return this;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  const middleware = requireRole('ADMIN');
  middleware(req, res, next);

  assert.equal(nextCalled, false, 'Next must NOT be called for EDITOR on admin-only route');
  assert.equal(statusCode, 403, 'Must return HTTP 403 Forbidden');
  assert.equal(responseBody.success, false);
});

test('rbac: Both ADMIN and EDITOR can access shared management endpoints', () => {
  const editorReq = {
    user: { id: 2, email: 'editor@manikpureidgah.org', role: 'EDITOR' },
  };
  const adminReq = {
    user: { id: 1, email: 'admin@manikpureidgah.org', role: 'ADMIN' },
  };

  let editorPassed = false;
  let adminPassed = false;

  const res = {
    status() {
      return this;
    },
    json() {
      return this;
    },
  };

  const middleware = requireRole('ADMIN', 'EDITOR');

  middleware(editorReq, res, () => {
    editorPassed = true;
  });
  middleware(adminReq, res, () => {
    adminPassed = true;
  });

  assert.equal(editorPassed, true, 'EDITOR must pass shared role check');
  assert.equal(adminPassed, true, 'ADMIN must pass shared role check');
});

test('rbac: Unauthenticated request is rejected with 401', () => {
  const req = { user: null };
  let statusCode = null;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };

  const middleware = requireRole('ADMIN');
  middleware(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(statusCode, 401, 'Must return 401 Unauthorized when user is missing');
});

