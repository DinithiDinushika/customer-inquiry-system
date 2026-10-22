import request from 'supertest';
import app from '../server.js';
import { pool } from '../config/db.js';

const runOverviewSmokeTest = async () => {
  console.log('--- Running Step 3: Inquiry Overview & Discovery Smoke Test ---');

  try {
    // 1. Authenticate as agent1
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'agent1@coffeeninja.com',
      password: 'Password123!',
    });
    const token = loginRes.body.token;

    // 2. Unauthenticated request to /api/inquiries (should be rejected with 401)
    console.log('[1/6] Testing unauthenticated access to /api/inquiries (expected 401)...');
    const unauthRes = await request(app).get('/api/inquiries');
    if (unauthRes.status === 401) {
      console.log('✓ Unauthenticated request properly blocked with 401 Unauthorized');
    } else {
      throw new Error(`Expected 401, got ${unauthRes.status}`);
    }

    // 3. Authenticated request to /api/inquiries (overview with counts)
    console.log('[2/6] Testing authenticated listing and counts (expected 200 + inquiries + counts)...');
    const listRes = await request(app)
      .get('/api/inquiries')
      .set('Authorization', `Bearer ${token}`);

    if (
      listRes.status === 200 &&
      Array.isArray(listRes.body.inquiries) &&
      typeof listRes.body.counts?.all === 'number' &&
      typeof listRes.body.counts?.new === 'number'
    ) {
      console.log(`✓ Fetched ${listRes.body.inquiries.length} inquiries.`);
      console.log('  Live counts:', JSON.stringify(listRes.body.counts));
    } else {
      throw new Error(`Expected inquiries array & counts, got: ${JSON.stringify(listRes.body)}`);
    }

    // 4. Status filter test (?status=NEW)
    console.log('[3/6] Testing status filter (?status=NEW)...');
    const newOnlyRes = await request(app)
      .get('/api/inquiries?status=NEW')
      .set('Authorization', `Bearer ${token}`);

    if (newOnlyRes.status === 200) {
      const allAreNew = newOnlyRes.body.inquiries.every((i: any) => i.status === 'NEW');
      if (allAreNew) {
        console.log(`✓ Filtered correctly: all ${newOnlyRes.body.inquiries.length} inquiries have status NEW.`);
      } else {
        throw new Error('Found non-NEW inquiry in filtered results');
      }
    } else {
      throw new Error(`Filter failed with status: ${newOnlyRes.status}`);
    }

    // 5. Search filter test (?search=Catering)
    console.log('[4/6] Testing text search filter (?search=Catering)...');
    const searchRes = await request(app)
      .get('/api/inquiries?search=Catering')
      .set('Authorization', `Bearer ${token}`);

    if (searchRes.status === 200 && searchRes.body.inquiries.length > 0) {
      console.log(`✓ Search matched ${searchRes.body.inquiries.length} inquiry/inquiries containing 'Catering'.`);
    } else {
      throw new Error(`Search failed or returned 0 results: ${JSON.stringify(searchRes.body)}`);
    }

    // 6. Invalid UUID format handling (expected 400 Bad Request)
    console.log('[5/6] Testing invalid UUID format (/api/inquiries/invalid-id-123, expected 400)...');
    const badIdRes = await request(app)
      .get('/api/inquiries/invalid-id-123')
      .set('Authorization', `Bearer ${token}`);

    if (badIdRes.status === 400 && badIdRes.body.error?.code === 'INVALID_ID_FORMAT') {
      console.log('✓ Invalid ID format cleanly rejected with 400 Bad Request');
    } else {
      throw new Error(`Expected 400 INVALID_ID_FORMAT, got: ${badIdRes.status}`);
    }

    // 7. Non-existent UUID handling (expected 404 Not Found)
    console.log('[6/6] Testing non-existent inquiry (/api/inquiries/00000000-0000-0000-0000-000000000000, expected 404)...');
    const notFoundRes = await request(app)
      .get('/api/inquiries/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);

    if (notFoundRes.status === 404 && notFoundRes.body.error?.code === 'INQUIRY_NOT_FOUND') {
      console.log('✓ Non-existent record cleanly handled with 404 Not Found');
    } else {
      throw new Error(`Expected 404 INQUIRY_NOT_FOUND, got: ${notFoundRes.status}`);
    }

    console.log('\n--- ALL STEP 3 OVERVIEW & DISCOVERY TESTS PASSED! ---');
  } finally {
    await pool.end();
  }
};

runOverviewSmokeTest().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
