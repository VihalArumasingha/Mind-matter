import { it, expect } from 'vitest';

const test = (name, fn) => it(name, fn);
const assert = {
  equal: (a, b, msg) => expect(a, msg).toBe(b),
  deepEqual: (a, b, msg) => expect(a, msg).toEqual(b),
  ok: (v, msg) => expect(v, msg).toBeTruthy(),
  match: (str, re, msg) => expect(String(str), msg).toMatch(re),
  rejects: async (fn, re) => {
    await expect(fn()).rejects.toThrow(re);
  },
};
import mongoose from 'mongoose';
import axios from 'axios';

import {
  createZoomMeeting,
  sendZoomLinkNotification,
} from '../utils/zoomUtils.js';

const FAKE_CREDS = {
  ZOOM_ACCOUNT_ID: 'test-account-id',
  ZOOM_CLIENT_ID: 'test-client-id',
  ZOOM_CLIENT_SECRET: 'test-client-secret',
  ZOOM_USER_ID: 'test-user@example.com',
};

// Run fn with fake Zoom env creds, then restore the original env
const withZoomCreds = async (fn) => {
  const saved = {};
  for (const key of Object.keys(FAKE_CREDS)) {
    saved[key] = process.env[key];
    process.env[key] = FAKE_CREDS[key];
  }
  try {
    await fn();
  } finally {
    for (const key of Object.keys(FAKE_CREDS)) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
};

// Run fn with Zoom creds removed, then restore the original env
const withoutZoomCreds = async (fn) => {
  const saved = {};
  for (const key of Object.keys(FAKE_CREDS)) {
    saved[key] = process.env[key];
    delete process.env[key];
  }
  try {
    await fn();
  } finally {
    for (const key of Object.keys(FAKE_CREDS)) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  }
};

// ─── createZoomMeeting: credential guard (no network) ───

test('createZoomMeeting fails fast when OAuth creds are missing', async () => {
  await withoutZoomCreds(async () => {
    await assert.rejects(
      () => createZoomMeeting(new Date(), 60, 'Session'),
      /credentials not configured/
    );
  });
});

// ─── createZoomMeeting: happy path with stubbed Zoom API ───

test('createZoomMeeting posts a scheduled meeting and maps response', async () => {
  await withZoomCreds(async () => {
    const calls = [];
    const realPost = axios.post;
    axios.post = async (url, data) => {
      calls.push({ url, data });
      if (url.includes('/oauth/token')) {
        return { data: { access_token: 'fake-token', expires_in: 3600 } };
      }
      return {
        data: {
          id: 123456789,
          join_url: 'https://zoom.us/j/123456789?pwd=abcXYZ',
          start_url: 'https://zoom.us/s/123456789?pwd=startABC',
          password: 'abcXYZ',
        },
      };
    };
    try {
      const out = await createZoomMeeting(
        new Date('2026-10-20T09:00:00Z'),
        45,
        'Counseling Session with Dr. Perera'
      );

      assert.equal(out.success, true);
      assert.equal(out.meetingId, 123456789);
      assert.equal(out.joinUrl, 'https://zoom.us/j/123456789?pwd=abcXYZ');
      assert.equal(out.password, 'abcXYZ');

      const meetingCall = calls.find((c) => c.url.includes('/v2/users/'));
      assert.ok(meetingCall, 'expected a meeting-creation call');
      assert.equal(meetingCall.data.type, 2);
      assert.equal(meetingCall.data.duration, 45);
      assert.equal(meetingCall.data.settings.waiting_room, true);
    } finally {
      axios.post = realPost;
    }
  });
});

test('createZoomMeeting normalizes bad duration to 60 minutes', async () => {
  await withZoomCreds(async () => {
    let sentData = null;
    const realPost = axios.post;
    axios.post = async (url, data) => {
      if (url.includes('/oauth/token')) {
        return { data: { access_token: 'fake-token', expires_in: 3600 } };
      }
      sentData = data;
      return { data: { id: 1, join_url: 'https://zoom.us/j/1', password: 'p' } };
    };
    const quiet = console.warn;
    console.warn = () => {};
    try {
      await createZoomMeeting('not-a-date', -5, 'Session');
      assert.equal(sentData.duration, 60);
      assert.ok(!Number.isNaN(Date.parse(sentData.start_time)));
    } finally {
      console.warn = quiet;
      axios.post = realPost;
    }
  });
});

test('createZoomMeeting surfaces Zoom API errors', async () => {
  await withZoomCreds(async () => {
    const realPost = axios.post;
    axios.post = async (url) => {
      if (url.includes('/oauth/token')) {
        return { data: { access_token: 'fake-token', expires_in: 3600 } };
      }
      const err = new Error('zoom down');
      err.response = { data: { message: 'Rate limit exceeded' } };
      throw err;
    };
    const quiet = console.error;
    console.error = () => {};
    try {
      await assert.rejects(
        () => createZoomMeeting(new Date(), 60, 'Session'),
        /Rate limit exceeded/
      );
    } finally {
      console.error = quiet;
      axios.post = realPost;
    }
  });
});

// ─── sendZoomLinkNotification: payload shape, no real DB ───

test('sendZoomLinkNotification creates a zoom_link_sent notification', async () => {
  const userId = new mongoose.Types.ObjectId();
  const bookingId = new mongoose.Types.ObjectId();
  const link = 'https://zoom.us/j/123456789?pwd=abcXYZ';
  let saved = null;

  const notifModule = await import('../models/Notification.js');
  const Notification = notifModule.default;
  const realCreate = Notification.create;
  Notification.create = async (doc) => {
    saved = doc;
    return { _id: new mongoose.Types.ObjectId(), ...doc };
  };
  const quiet = console.log;
  console.log = () => {};
  try {
    const out = await sendZoomLinkNotification(
      userId,
      link,
      'Mon, Oct 20',
      '09:00',
      'Dr. Perera',
      bookingId
    );

    assert.deepEqual(out, { success: true });
    assert.equal(saved.type, 'zoom_link_sent');
    assert.equal(saved.title, 'Zoom Meeting Link');
    assert.equal(String(saved.userId), String(userId));
    assert.equal(String(saved.relatedBookingId), String(bookingId));
    assert.equal(saved.isRead, false);
    // raw English link embedded untouched (never translated)
    assert.ok(saved.message.includes(link));
    assert.ok(saved.message.includes('Dr. Perera'));
  } finally {
    console.log = quiet;
    Notification.create = realCreate;
  }
});

test('sendZoomLinkNotification reports failure when DB write fails', async () => {
  const notifModule = await import('../models/Notification.js');
  const Notification = notifModule.default;
  const realCreate = Notification.create;
  Notification.create = async () => {
    throw new Error('db down');
  };
  const quiet = console.error;
  console.error = () => {};
  try {
    const out = await sendZoomLinkNotification(
      new mongoose.Types.ObjectId(),
      'https://zoom.us/j/1',
      'Mon, Oct 20',
      '09:00',
      'Dr. Perera'
    );

    assert.equal(out.success, false);
    assert.equal(out.error, 'db down');
  } finally {
    console.error = quiet;
    Notification.create = realCreate;
  }
});
