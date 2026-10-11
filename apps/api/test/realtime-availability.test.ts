import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, sessionCookie } from './helpers/app';
import { createTestDb, resetDb } from './helpers/db';
import { createCourt, createUser } from './helpers/factories';
import { openEventStream } from './helpers/sse';

const db = createTestDb();
const app = createTestApp(db, { clock: fixedClock('2026-07-01T00:00:00.000Z') });
let server: Server;
let eventsUrl: string;

beforeAll(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  eventsUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/events`;
});
beforeEach(() => resetDb(db));
afterAll(async () => {
  server.closeAllConnections();
  server.close();
  await db.$disconnect();
});

describe('real-time availability', () => {
  it("pushes another user's booking and cancellation to an open stream", async () => {
    const alice = await createUser(db);
    const bob = await createUser(db);
    const court = await createCourt(db, { openHour: 0, closeHour: 24 });
    const aliceCookie = await sessionCookie(alice.id);
    const stream = await openEventStream(eventsUrl, await sessionCookie(bob.id));
    const change = {
      event: 'availability.changed',
      data: { courtId: court.id, date: '2026-07-16' },
    };

    try {
      expect(stream.status).toBe(200);
      expect(stream.contentType).toContain('text/event-stream');

      const booked = await request(app)
        .post('/api/bookings')
        .set('Cookie', aliceCookie)
        .send({ courtId: court.id, startsAt: '2026-07-15T23:00:00.000Z', durationHours: 1 });
      expect(await stream.next()).toEqual(change);

      await request(app)
        .post(`/api/bookings/${booked.body.id}/cancel`)
        .set('Cookie', aliceCookie)
        .send({});
      expect(await stream.next()).toEqual(change);
    } finally {
      stream.close();
    }
  });
});
