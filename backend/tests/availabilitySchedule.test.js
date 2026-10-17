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
  saveAvailabilitySchedule,
  updateAvailabilityStatus,
  getAvailabilitySchedule,
} from '../controllers/volunteer/volunteerController.js';
import Availability from '../models/Availability.js';
import AvailabilitySlot from '../models/AvailabilitySlot.js';

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

const withStubs = async (stubs, fn) => {
  const originals = new Map();
  for (const [obj, method, replacement] of stubs) {
    originals.set([obj, method], obj[method]);
    obj[method] = replacement;
  }
  try {
    await fn();
  } finally {
    for (const [[obj, method], original] of originals) {
      obj[method] = original;
    }
  }
};

const fakeAvailabilityDoc = (overrides = {}) => ({
  user: new mongoose.Types.ObjectId(),
  isAvailable: true,
  weeklySchedule: new Map(),
  save: async function () {
    return this;
  },
  ...overrides,
});
// ─── saveAvailabilitySchedule: junk slots filtered, valid ones persisted ───

test('saveAvailabilitySchedule skips slots missing start/end', async () => {
  const req = mockReq({
    body: {
      slotsByDate: {
        '2026-10-20': [
          { start: '09:00', end: '10:00' },
          { start: '', end: '11:00' },
          { start: '12:00', end: '' },
          { start: '14:00', end: '15:00' },
        ],
      },
    },
  });
  const res = mockRes();
  const availability = fakeAvailabilityDoc();

  let deletedFilter = null;
  let inserted = null;
  const savedSlots = [
    { _id: new mongoose.Types.ObjectId(), date: '2026-10-20', start: '09:00', end: '10:00' },
    { _id: new mongoose.Types.ObjectId(), date: '2026-10-20', start: '14:00', end: '15:00' },
  ];

  await withStubs(
    [
      [Availability, 'findOne', async () => availability],
      [AvailabilitySlot, 'deleteMany', async (f) => { deletedFilter = f; return { deletedCount: 1 }; }],
      [AvailabilitySlot, 'insertMany', async (docs) => { inserted = docs; return docs; }],
      [AvailabilitySlot, 'find', () => ({ sort: async () => savedSlots })],
    ],
    async () => {
      await saveAvailabilitySchedule(req, res);
    }
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.deepEqual(String(deletedFilter.user), String(req.user._id));
  assert.equal(inserted.length, 2);
  assert.ok(inserted.every((s) => s.start && s.end));
  assert.ok(inserted.every((s) => s.date === '2026-10-20'));
});

test('saveAvailabilitySchedule inherits the date key when slot omits date', async () => {
  const req = mockReq({
    body: { slotsByDate: { '2026-10-21': [{ start: '09:00', end: '10:00' }] } },
  });
  const res = mockRes();
  const availability = fakeAvailabilityDoc();
  let inserted = null;

  await withStubs(
    [
      [Availability, 'findOne', async () => availability],
      [AvailabilitySlot, 'deleteMany', async () => ({ deletedCount: 0 })],
      [AvailabilitySlot, 'insertMany', async (docs) => { inserted = docs; return docs; }],
      [AvailabilitySlot, 'find', () => ({ sort: async () => [] })],
    ],
    async () => {
      await saveAvailabilitySchedule(req, res);
    }
  );

  assert.equal(res.statusCode, 200);
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].date, '2026-10-21');
});

test('saveAvailabilitySchedule skips DB write when no slots sent', async () => {
  const req = mockReq({ body: { isAvailable: false } });
  const res = mockRes();
  const availability = fakeAvailabilityDoc();
  let deleteCalled = false;
  let insertCalled = false;

  await withStubs(
    [
      [Availability, 'findOne', async () => availability],
      [AvailabilitySlot, 'deleteMany', async () => { deleteCalled = true; return {}; }],
      [AvailabilitySlot, 'insertMany', async () => { insertCalled = true; return []; }],
      [AvailabilitySlot, 'find', () => ({ sort: async () => [] })],
    ],
    async () => {
      await saveAvailabilitySchedule(req, res);
    }
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(availability.isAvailable, false);
  assert.equal(deleteCalled, false);
  assert.equal(insertCalled, false);
});

// ─── updateAvailabilityStatus: toggle persisted ───

test('updateAvailabilityStatus flips availability on and off', async () => {
  for (const value of [false, true]) {
    const req = mockReq({ body: { isAvailable: value } });
    const res = mockRes();
    const availability = fakeAvailabilityDoc({ isAvailable: !value });

    await withStubs(
      [[Availability, 'findOne', async () => availability]],
      async () => {
        await updateAvailabilityStatus(req, res);
      }
    );

    assert.equal(res.statusCode, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.isAvailable, value);
  }
});

// ─── getAvailabilitySchedule: slots grouped by date ───

test('getAvailabilitySchedule groups slots by date', async () => {
  const req = mockReq();
  const res = mockRes();
  const availability = fakeAvailabilityDoc({
    weeklySchedule: new Map([['monday', [{ start: '09:00', end: '12:00' }]]]),
  });
  const slots = [
    { _id: new mongoose.Types.ObjectId(), date: '2026-10-20', start: '09:00', end: '10:00' },
    { _id: new mongoose.Types.ObjectId(), date: '2026-10-20', start: '11:00', end: '12:00' },
    { _id: new mongoose.Types.ObjectId(), date: '2026-10-21', start: '09:00', end: '10:00' },
  ];

  await withStubs(
    [
      [Availability, 'findOne', async () => availability],
      [AvailabilitySlot, 'find', () => ({ sort: async () => slots })],
    ],
    async () => {
      await getAvailabilitySchedule(req, res);
    }
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.slotsByDate['2026-10-20'].length, 2);
  assert.equal(res.body.data.slotsByDate['2026-10-21'].length, 1);
  assert.equal(res.body.data.slots.length, 3);
  assert.deepEqual(res.body.data.weeklySchedule, {
    monday: [{ start: '09:00', end: '12:00' }],
  });
});

test('getAvailabilitySchedule returns 500 when the database fails', async () => {
  const req = mockReq();
  const res = mockRes();

  const quiet = console.error;
  console.error = () => {};
  try {
    await withStubs(
      [
        [Availability, 'findOne', async () => { throw new Error('db down'); }],
        [AvailabilitySlot, 'find', () => ({ sort: async () => [] })],
      ],
      async () => {
        await getAvailabilitySchedule(req, res);
      }
    );
  } finally {
    console.error = quiet;
  }

  assert.equal(res.statusCode, 500);
  assert.match(res.body.message, /fetching availability schedule/);
});
