import { it, expect } from 'vitest';

const test = (name, fn) => it(name, fn);
const assert = {
  equal: (a, b, msg) => expect(a, msg).toBe(b),
  deepEqual: (a, b, msg) => expect(a, msg).toEqual(b),
  ok: (v, msg) => expect(v, msg).toBeTruthy(),
  match: (str, re, msg) => expect(String(str), msg).toMatch(re),
};
import mongoose from 'mongoose';

import {
  acceptVolunteerRequest,
  createAvailabilitySlot,
  declineVolunteerRequest,
} from '../controllers/volunteer/volunteerController.js';
import Booking from '../models/Booking.js';
import AvailabilitySlot from '../models/AvailabilitySlot.js';

// Minimal Express-like req/res doubles (no DB touched on validation paths)
const mockReq = (overrides = {}) => ({
  params: {},
  query: {},
  body: {},
  user: { _id: new mongoose.Types.ObjectId() },
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.statusCode = null;
  res.body = null;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.body = payload;
    return res;
  };
  return res;
};

// ─── Availability slot creation: missing required fields → 400 (no DB hit) ───

test('createAvailabilitySlot rejects a slot with no date', async () => {
  const req = mockReq({ body: { start: '09:00', end: '10:00' } });
  const res = mockRes();

  await createAvailabilitySlot(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /date, start, and end are required/);
});

test('createAvailabilitySlot rejects a slot with no start time', async () => {
  const req = mockReq({ body: { date: '2026-10-20', end: '10:00' } });
  const res = mockRes();

  await createAvailabilitySlot(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /date, start, and end are required/);
});

test('createAvailabilitySlot rejects a slot with no end time', async () => {
  const req = mockReq({ body: { date: '2026-10-20', start: '09:00' } });
  const res = mockRes();

  await createAvailabilitySlot(req, res);

  assert.equal(res.statusCode, 400);
  assert.match(res.body.message, /date, start, and end are required/);
});

// ─── Booking accept/decline: invalid booking ID → 400 (no DB hit) ───

test('acceptVolunteerRequest rejects an invalid booking ID', async () => {
  const req = mockReq({ params: { id: 'not-a-valid-id' } });
  const res = mockRes();

  await acceptVolunteerRequest(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Invalid booking ID');
});

test('acceptVolunteerRequest rejects a missing booking ID', async () => {
  const req = mockReq({ params: {} });
  const res = mockRes();

  await acceptVolunteerRequest(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

test('declineVolunteerRequest rejects an invalid booking ID', async () => {
  const req = mockReq({ params: { id: 'not-a-valid-id' }, body: {} });
  const res = mockRes();

  await declineVolunteerRequest(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.message, 'Invalid booking ID');
});

test('declineVolunteerRequest rejects a missing booking ID', async () => {
  const req = mockReq({ params: {}, body: {} });
  const res = mockRes();

  await declineVolunteerRequest(req, res);

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
});

// ─── Booking model: defaults and required-field validation (sync, no DB) ───

const validBookingData = () => ({
  user: new mongoose.Types.ObjectId(),
  professional: new mongoose.Types.ObjectId(),
  professionalName: 'Dr. Perera',
  profession: 'Clinical Psychologist',
  date: '2026-10-20',
  startTime: '09:00',
  endTime: '10:00',
  fullName: 'Amal Silva',
  phone: '0771234567',
  reason: 'Exam stress',
});

test('new bookings default to pending with no Zoom link sent', () => {
  const booking = new Booking(validBookingData());

  assert.equal(booking.status, 'pending');
  assert.equal(booking.zoomLinkSent, false);
  assert.equal(booking.zoomMeetingLink, '');
  assert.equal(booking.reminderSent, false);
});

test('booking validation fails when required fields are missing', async () => {
  const booking = new Booking({});
  const error = await booking.validate().then(() => null, (e) => e);

  assert.ok(error, 'expected a validation error');
  for (const field of [
    'user',
    'professional',
    'professionalName',
    'profession',
    'date',
    'startTime',
    'endTime',
    'fullName',
    'phone',
    'reason',
  ]) {
    assert.ok(error.errors[field], `expected validation error for ${field}`);
  }
});

test('booking validation passes for a complete booking', async () => {
  const booking = new Booking(validBookingData());
  await booking.validate();
});

test('booking status only accepts known lifecycle values', async () => {
  const booking = new Booking({ ...validBookingData(), status: 'archived' });
  const error = await booking.validate().then(() => null, (e) => e);

  assert.ok(error, 'expected a validation error');
  assert.ok(error.errors.status, 'expected validation error for status');
});

// ─── AvailabilitySlot model: defaults and required-field validation ───

test('availability slot validation fails when date/start/end are missing', async () => {
  const slot = new AvailabilitySlot({ user: new mongoose.Types.ObjectId() });
  const error = await slot.validate().then(() => null, (e) => e);

  assert.ok(error, 'expected a validation error');
  assert.ok(error.errors.date);
  assert.ok(error.errors.start);
  assert.ok(error.errors.end);
});

test('availability slot defaults optional break fields to empty strings', async () => {
  const slot = new AvailabilitySlot({
    user: new mongoose.Types.ObjectId(),
    date: '2026-10-20',
    start: '09:00',
    end: '10:00',
  });
  await slot.validate();

  assert.equal(slot.slotDuration, '');
  assert.equal(slot.breakStart, '');
  assert.equal(slot.breakEnd, '');
  assert.equal(slot.breakDuration, '');
});
