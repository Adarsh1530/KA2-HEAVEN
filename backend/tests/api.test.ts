import request from 'supertest';
import app from '../src/app';
import { db } from '../src/db';

beforeAll(async () => {
  await db.init();
});

describe('KA² — HEAVEN Comprehensive API Tests', () => {
  let keerthiToken = '';
  let anuToken = '';
  let keerthiId = '';
  let anuId = '';

  // 1. Health check
  it('GET /api/health returns healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.app).toBe('KA² — HEAVEN');
    expect(res.body.tagline).toBe('A Heaven Made for Two.');
  });

  // 2. Authentication: Login as Keerthi (Admin)
  it('POST /api/auth/login logs in Keerthi successfully', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'keerthi@ka2heaven.local',
      password: 'Keerthi@Heaven2026!',
      deviceName: 'Keerthi iPhone 16 Pro',
      deviceType: 'ios',
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Keerthi Adarsh');
    expect(res.body.user.role).toBe('admin');
    expect(res.body.tokens.accessToken).toBeDefined();

    keerthiToken = res.body.tokens.accessToken;
    keerthiId = res.body.user.id;
  });

  // 3. Authentication: Login as Anu
  it('POST /api/auth/login logs in Anu successfully', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'anu@ka2heaven.local',
      password: 'AnuSri@Heaven2026!',
      deviceName: 'Anu iPhone 15',
      deviceType: 'ios',
    });

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Anu Sri');
    expect(res.body.user.role).toBe('user');
    expect(res.body.tokens.accessToken).toBeDefined();

    anuToken = res.body.tokens.accessToken;
    anuId = res.body.user.id;
  });

  // 4. Authentication: Invalid Credentials Rejected
  it('POST /api/auth/login rejects invalid password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'keerthi@ka2heaven.local',
      password: 'WrongPassword123!',
    });

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });

  // 5. Profile & Me endpoint
  it('GET /api/auth/me returns profile and partner info', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${keerthiToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.name).toBe('Keerthi Adarsh');
    expect(res.body.partner.name).toBe('Anu Sri');
  });

  // 6. Security PIN verification
  it('POST /api/auth/pin/verify validates correct PIN', async () => {
    const res = await request(app)
      .post('/api/auth/pin/verify')
      .set('Authorization', `Bearer ${keerthiToken}`)
      .send({ pin: '2808' });

    expect(res.status).toBe(200);
    expect(res.body.verified).toBe(true);
  });

  // 7. Realtime Chat: Sending & Receiving
  let testMessageId = '';
  it('POST /api/chat/messages sends a message from Keerthi to Anu', async () => {
    const res = await request(app)
      .post('/api/chat/messages')
      .set('Authorization', `Bearer ${keerthiToken}`)
      .send({
        content: 'You are the most beautiful part of my life ❤️',
        type: 'text',
      });

    expect(res.status).toBe(201);
    expect(res.body.message.content).toBe('You are the most beautiful part of my life ❤️');
    expect(res.body.message.senderId).toBe(keerthiId);
    testMessageId = res.body.message.id;
  });

  // 8. Chat Reaction
  it('POST /api/chat/messages/:id/react adds a heart reaction', async () => {
    const res = await request(app)
      .post(`/api/chat/messages/${testMessageId}/react`)
      .set('Authorization', `Bearer ${anuToken}`)
      .send({ emoji: '❤️' });

    expect(res.status).toBe(200);
    expect(res.body.reactions).toBeDefined();
    expect(res.body.reactions.some((r: any) => r.emoji === '❤️')).toBe(true);
  });

  // 9. Memories: Create & Retrieve
  it('POST /api/memories creates a new memory', async () => {
    const res = await request(app)
      .post('/api/memories')
      .set('Authorization', `Bearer ${keerthiToken}`)
      .send({
        title: 'Our First Sunset Beach Walk',
        description: 'Golden hour waves and endless laughs.',
        date: '2026-08-28',
        location: 'Paradise Cove',
        category: 'photos',
        mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
        isFavorite: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.memory.title).toBe('Our First Sunset Beach Walk');
  });

  // 10. Private Vault: Personal vs Shared Isolation
  it('POST /api/vault creates personal and shared items', async () => {
    // Keerthi creates a Personal Vault item
    const personalRes = await request(app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${keerthiToken}`)
      .send({
        title: 'Surprise Anniversary Plan',
        vaultType: 'personal',
        itemType: 'secret',
        encryptedData: 'CiphertextPrivate123==',
        iv: 'iv123',
      });
    expect(personalRes.status).toBe(201);

    // Keerthi creates a Shared Vault item
    const sharedRes = await request(app)
      .post('/api/vault')
      .set('Authorization', `Bearer ${keerthiToken}`)
      .send({
        title: 'Our Joint Savings & Passport Copies',
        vaultType: 'shared',
        itemType: 'document',
        encryptedData: 'CiphertextShared456==',
        iv: 'iv456',
      });
    expect(sharedRes.status).toBe(201);

    // Anu checks personal vault (should NOT see Keerthi's personal surprise)
    const anuPersonalRes = await request(app)
      .get('/api/vault?vaultType=personal')
      .set('Authorization', `Bearer ${anuToken}`);
    expect(anuPersonalRes.status).toBe(200);
    const hasKeerthiSecret = anuPersonalRes.body.items.some(
      (item: any) => item.title === 'Surprise Anniversary Plan'
    );
    expect(hasKeerthiSecret).toBe(false);

    // Anu checks shared vault (SHOULD see the joint item)
    const anuSharedRes = await request(app)
      .get('/api/vault?vaultType=shared')
      .set('Authorization', `Bearer ${anuToken}`);
    expect(anuSharedRes.status).toBe(200);
    const hasShared = anuSharedRes.body.items.some(
      (item: any) => item.title === 'Our Joint Savings & Passport Copies'
    );
    expect(hasShared).toBe(true);
  });

  // 11. Love Notes: Send and Open
  it('POST /api/love-notes creates a love letter', async () => {
    const res = await request(app)
      .post('/api/love-notes')
      .set('Authorization', `Bearer ${anuToken}`)
      .send({
        title: 'Thank You For Building Our Heaven',
        message: 'Every moment with you feels like home.',
        stationeryStyle: 'rose_gold',
      });

    expect(res.status).toBe(201);
    expect(res.body.loveNote.title).toBe('Thank You For Building Our Heaven');
  });

  // 12. Admin Controls & Protection
  it('GET /api/admin/telemetry works for Keerthi (Admin) but is forbidden for Anu', async () => {
    const adminRes = await request(app)
      .get('/api/admin/telemetry')
      .set('Authorization', `Bearer ${keerthiToken}`);
    expect(adminRes.status).toBe(200);
    expect(adminRes.body.telemetry.uptimeSeconds).toBeGreaterThanOrEqual(0);

    const nonAdminRes = await request(app)
      .get('/api/admin/telemetry')
      .set('Authorization', `Bearer ${anuToken}`);
    expect(nonAdminRes.status).toBe(403);
  });
});
