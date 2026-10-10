import request from 'supertest';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestApp, fixedClock, sessionCookie } from './helpers/app';
import { createTestDb, resetDb } from './helpers/db';
import { createBooking, createCourt, createUser } from './helpers/factories';

const db = createTestDb();
const clock = fixedClock('2026-12-15T10:20:00.000Z');
const app = createTestApp(db, { clock });

beforeEach(async () => {
  await resetDb(db);
  clock.set('2026-12-15T10:20:00.000Z');
});
afterAll(() => db.$disconnect());

const asUser = async () => sessionCookie((await createUser(db, { role: 'USER' })).id);
const asAdmin = async () => sessionCookie((await createUser(db, { role: 'ADMIN' })).id);

const validCourt = {
  name: 'Padel 3',
  sportType: 'PADEL',
  hourlyPriceCents: 3000,
  openHour: 8,
  closeHour: 22,
};

describe('GET /api/courts', () => {
  it('requires a session', async () => {
    expect((await request(app).get('/api/courts')).status).toBe(401);
  });

  it('lists only active courts', async () => {
    await createCourt(db, { name: 'Active' });
    await createCourt(db, { name: 'Closed', isActive: false });

    const res = await request(app)
      .get('/api/courts')
      .set('Cookie', await asUser());

    expect(res.status).toBe(200);
    expect(res.body.map((c: { name: string }) => c.name)).toEqual(['Active']);
  });
});

describe('GET /api/courts/:id/availability', () => {
  it('returns one slot per opening hour with local labels', async () => {
    const court = await createCourt(db, { openHour: 8, closeHour: 23 });

    const res = await request(app)
      .get(`/api/courts/${court.id}/availability?date=2026-12-16`)
      .set('Cookie', await asUser());

    expect(res.status).toBe(200);
    expect(res.body.date).toBe('2026-12-16');
    expect(res.body.slots).toHaveLength(15);
    expect(res.body.slots[0]).toEqual({
      startsAt: '2026-12-16T08:00:00.000Z',
      endsAt: '2026-12-16T09:00:00.000Z',
      localTime: '08:00',
      status: 'AVAILABLE',
      mine: false,
    });
  });

  it('labels slots in facility time during summer', async () => {
    clock.set('2026-07-01T00:00:00.000Z');
    const court = await createCourt(db, { openHour: 8, closeHour: 10 });

    const res = await request(app)
      .get(`/api/courts/${court.id}/availability?date=2026-07-15`)
      .set('Cookie', await asUser());

    expect(
      res.body.slots.map((s: { startsAt: string; localTime: string }) => [s.startsAt, s.localTime]),
    ).toEqual([
      ['2026-07-15T07:00:00.000Z', '08:00'],
      ['2026-07-15T08:00:00.000Z', '09:00'],
    ]);
  });

  it('marks booked, own and past slots', async () => {
    const me = await createUser(db);
    const other = await createUser(db);
    const court = await createCourt(db, { openHour: 8, closeHour: 16 });
    await createBooking(db, {
      userId: me.id,
      courtId: court.id,
      startsAt: '2026-12-15T12:00:00.000Z',
    });
    await createBooking(db, {
      userId: other.id,
      courtId: court.id,
      startsAt: '2026-12-15T14:00:00.000Z',
      durationHours: 2,
    });
    await createBooking(db, {
      userId: other.id,
      courtId: court.id,
      startsAt: '2026-12-15T13:00:00.000Z',
      status: 'CANCELLED',
    });

    const res = await request(app)
      .get(`/api/courts/${court.id}/availability?date=2026-12-15`)
      .set('Cookie', await sessionCookie(me.id));

    const view = res.body.slots.map((s: { localTime: string; status: string; mine: boolean }) =>
      [s.localTime, s.status, s.mine].join(' '),
    );
    expect(view).toEqual([
      '08:00 PAST false',
      '09:00 PAST false',
      '10:00 PAST false',
      '11:00 AVAILABLE false',
      '12:00 BOOKED true',
      '13:00 AVAILABLE false',
      '14:00 BOOKED false',
      '15:00 BOOKED false',
    ]);
  });

  it('rejects an inactive court with 422', async () => {
    const court = await createCourt(db, { isActive: false });

    const res = await request(app)
      .get(`/api/courts/${court.id}/availability?date=2026-12-16`)
      .set('Cookie', await asUser());

    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe('COURT_INACTIVE');
  });

  it('returns 404 for an unknown court and 400 for a bad date', async () => {
    const cookie = await asUser();
    const court = await createCourt(db);

    const unknown = await request(app)
      .get('/api/courts/999999/availability?date=2026-12-16')
      .set('Cookie', cookie);
    const badDate = await request(app)
      .get(`/api/courts/${court.id}/availability?date=2026-02-30`)
      .set('Cookie', cookie);
    const missingDate = await request(app)
      .get(`/api/courts/${court.id}/availability`)
      .set('Cookie', cookie);

    expect(unknown.status).toBe(404);
    expect(badDate.status).toBe(400);
    expect(missingDate.status).toBe(400);
  });
});

describe('admin court management', () => {
  it('is forbidden for users and requires a session', async () => {
    const cookie = await asUser();

    expect((await request(app).get('/api/admin/courts')).status).toBe(401);
    expect((await request(app).get('/api/admin/courts').set('Cookie', cookie)).status).toBe(403);
    expect(
      (await request(app).post('/api/admin/courts').set('Cookie', cookie).send(validCourt)).status,
    ).toBe(403);
  });

  it('creates a court and lists inactive ones too', async () => {
    const cookie = await asAdmin();
    await createCourt(db, { name: 'Old', isActive: false });

    const created = await request(app)
      .post('/api/admin/courts')
      .set('Cookie', cookie)
      .send(validCourt);
    const list = await request(app).get('/api/admin/courts').set('Cookie', cookie);

    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ ...validCourt, isActive: true, id: expect.any(Number) });
    expect(list.body.map((c: { name: string }) => c.name)).toEqual(['Old', 'Padel 3']);
  });

  it.each([
    ['opening after closing', { ...validCourt, openHour: 22, closeHour: 8 }],
    ['a fractional price', { ...validCourt, hourlyPriceCents: 10.5 }],
    ['an unknown sport', { ...validCourt, sportType: 'GOLF' }],
    ['an unexpected field', { ...validCourt, price: 30 }],
  ])('rejects %s with 400', async (_label, body) => {
    const res = await request(app)
      .post('/api/admin/courts')
      .set('Cookie', await asAdmin())
      .send(body);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('applies a partial update', async () => {
    const court = await createCourt(db, { name: 'Before' });

    const res = await request(app)
      .patch(`/api/admin/courts/${court.id}`)
      .set('Cookie', await asAdmin())
      .send({ name: 'After', hourlyPriceCents: 4000 });

    expect(res.status).toBe(200);
    expect(res.body.court).toMatchObject({ name: 'After', hourlyPriceCents: 4000, openHour: 8 });
    expect(res.body.warnings).toEqual({ affectedFutureBookings: 0 });
  });

  it('validates a single hour against the stored value', async () => {
    const court = await createCourt(db, { openHour: 8, closeHour: 12 });

    const res = await request(app)
      .patch(`/api/admin/courts/${court.id}`)
      .set('Cookie', await asAdmin())
      .send({ openHour: 14 });

    expect(res.status).toBe(400);
    expect(res.body.error.details).toEqual([
      { path: 'closeHour', message: 'openHour must be before closeHour' },
    ]);
  });

  it('returns 404 when updating an unknown court', async () => {
    const res = await request(app)
      .patch('/api/admin/courts/999999')
      .set('Cookie', await asAdmin())
      .send({ name: 'Ghost' });

    expect(res.status).toBe(404);
  });

  it('deactivates a court, keeps its bookings and reports affected future ones', async () => {
    const user = await createUser(db);
    const court = await createCourt(db);
    await createBooking(db, {
      userId: user.id,
      courtId: court.id,
      startsAt: '2026-12-14T10:00:00.000Z',
    });
    await createBooking(db, {
      userId: user.id,
      courtId: court.id,
      startsAt: '2026-12-16T10:00:00.000Z',
    });
    await createBooking(db, {
      userId: user.id,
      courtId: court.id,
      startsAt: '2026-12-17T10:00:00.000Z',
    });

    const res = await request(app)
      .patch(`/api/admin/courts/${court.id}`)
      .set('Cookie', await asAdmin())
      .send({ isActive: false });
    const courts = await request(app)
      .get('/api/courts')
      .set('Cookie', await asUser());

    expect(res.body.court.isActive).toBe(false);
    expect(res.body.warnings).toEqual({ affectedFutureBookings: 2 });
    expect(await db.booking.count({ where: { courtId: court.id, status: 'CONFIRMED' } })).toBe(3);
    expect(courts.body).toEqual([]);
  });

  it('counts future bookings left outside narrowed opening hours', async () => {
    const user = await createUser(db);
    const court = await createCourt(db, { openHour: 8, closeHour: 23 });
    await createBooking(db, {
      userId: user.id,
      courtId: court.id,
      startsAt: '2026-12-16T09:00:00.000Z',
    });
    await createBooking(db, {
      userId: user.id,
      courtId: court.id,
      startsAt: '2026-12-16T15:00:00.000Z',
    });
    await createBooking(db, {
      userId: user.id,
      courtId: court.id,
      startsAt: '2026-12-16T20:00:00.000Z',
      durationHours: 2,
    });

    const res = await request(app)
      .patch(`/api/admin/courts/${court.id}`)
      .set('Cookie', await asAdmin())
      .send({ openHour: 10, closeHour: 21 });

    expect(res.body.warnings).toEqual({ affectedFutureBookings: 2 });
  });
});
