import request from 'supertest';
import app from '../server.js';
import { pool } from '../config/db.js';

const runSmokeTest = async () => {
  console.log('--- Running Authentication Flow Smoke Test ---');

  try {
    // 1. Missing credentials
    console.log('[1/5] Testing missing credentials (expected 400)...');
    const res1 = await request(app).post('/api/auth/login').send({});
    if (res1.status === 400) {
      console.log('✓ Rejected missing credentials with 400 Bad Request');
    } else {
      throw new Error(`Expected 400, got ${res1.status}`);
    }

    // 2. Bad credentials
    console.log('[2/5] Testing invalid password (expected 401)...');
    const res2 = await request(app).post('/api/auth/login').send({
      email: 'agent1@coffeeninja.com',
      password: 'WrongPassword!',
    });
    if (res2.status === 401) {
      console.log('✓ Rejected bad credentials with 401 Unauthorized');
    } else {
      throw new Error(`Expected 401, got ${res2.status}`);
    }

    // 3. Valid login
    console.log('[3/5] Testing valid seeded agent login (expected 200 + JWT)...');
    const res3 = await request(app).post('/api/auth/login').send({
      email: 'agent1@coffeeninja.com',
      password: 'Password123!',
    });
    if (res3.status === 200 && res3.body.token && res3.body.user?.email === 'agent1@coffeeninja.com') {
      console.log(`✓ Login successful! Token received. User: ${res3.body.user.fullName} (${res3.body.user.role})`);
    } else {
      throw new Error(`Login failed: ${JSON.stringify(res3.body)}`);
    }

    const token = res3.body.token;

    // 4. Protected /api/auth/me without token
    console.log('[4/5] Testing /api/auth/me without Bearer token (expected 401)...');
    const res4 = await request(app).get('/api/auth/me');
    if (res4.status === 401) {
      console.log('✓ Protected route blocked unauthenticated request with 401');
    } else {
      throw new Error(`Expected 401, got ${res4.status}`);
    }

    // 5. Protected /api/auth/me with Bearer token
    console.log('[5/5] Testing /api/auth/me with Bearer token (expected 200)...');
    const res5 = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    if (res5.status === 200 && res5.body.user?.id === res3.body.user.id) {
      console.log(`✓ Authenticated session verified for: ${res5.body.user.email}`);
    } else {
      throw new Error(`Session verification failed: ${JSON.stringify(res5.body)}`);
    }

    console.log('\n--- ALL AUTHENTICATION FLOW TESTS PASSED SUCCESSFULLY! ---');
  } finally {
    await pool.end();
  }
};

runSmokeTest().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
