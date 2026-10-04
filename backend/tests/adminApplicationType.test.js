import test from 'node:test';
import assert from 'node:assert/strict';

import {
  resolveApplicationType,
  buildApplicationTypeQuery,
  getApprovalRoleForApplication
} from '../controllers/admin/adminController.js';

test('resolves a professional application type', () => {
  assert.equal(resolveApplicationType({ applicationType: 'professional' }), 'professional');
  assert.equal(resolveApplicationType({ profession: 'Clinical Psychologist' }), 'professional');
});

test('resolves a community organizer application type from legacy and new data', () => {
  assert.equal(resolveApplicationType({ profession: 'Community Organizer' }), 'communityOrganizer');
  assert.equal(resolveApplicationType({ applicationType: 'communityOrganizer' }), 'communityOrganizer');
});

test('builds a professional filter that excludes legacy community organizer records', () => {
  const query = buildApplicationTypeQuery('professional');

  assert.deepEqual(query, {
    $or: [
      { applicationType: 'professional' },
      { applicationType: { $exists: false }, profession: { $ne: 'Community Organizer' } }
    ]
  });
});

test('builds an organizer filter that includes legacy organizer records', () => {
  const query = buildApplicationTypeQuery('communityOrganizer');

  assert.deepEqual(query, {
    $or: [
      { applicationType: 'communityOrganizer' },
      { applicationType: { $exists: false }, profession: 'Community Organizer' }
    ]
  });
});

test('approvals map organizer applications to the communityOrganizer role', () => {
  assert.equal(getApprovalRoleForApplication({ applicationType: 'communityOrganizer' }), 'communityOrganizer');
  assert.equal(getApprovalRoleForApplication({ profession: 'Community Organizer' }), 'communityOrganizer');
  assert.equal(getApprovalRoleForApplication({ profession: 'Clinical Psychologist' }), 'therapist');
});
