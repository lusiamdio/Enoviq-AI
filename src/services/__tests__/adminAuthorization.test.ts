import assert from 'node:assert/strict';
import test from 'node:test';
import { isAdminRole } from '../adminAuthorization';

test('isAdminRole accepts server-authorized admin roles', () => {
  assert.equal(isAdminRole('lead_sommelier'), true);
  assert.equal(isAdminRole('admin'), true);
  assert.equal(isAdminRole('super_admin'), true);
});

test('isAdminRole rejects frontend-only or ordinary roles', () => {
  assert.equal(isAdminRole('explorer'), false);
  assert.equal(isAdminRole('suspended'), false);
  assert.equal(isAdminRole('owner@example.com'), false);
  assert.equal(isAdminRole(null), false);
});
