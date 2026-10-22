import request from 'supertest';
import app from '../server.js';
import { pool } from '../config/db.js';

const runLifecycleSmokeTest = async () => {
  console.log('--- Running Step 4: Inquiry Lifecycle & Stale Data Concurrency Smoke Test ---');

  try {
    // 1. Authenticate as agent1
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'agent1@coffeeninja.com',
      password: 'Password123!',
    });
    const token = loginRes.body.token;

    // 2. Create a fresh NEW inquiry for testing lifecycle
    const createRes = await request(app)
      .post('/api/inquiries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Saman Gunawardena',
        contactInfo: '0714567890',
        subject: `Lifecycle & Concurrency Test Ticket #${Date.now()}`,
        description: 'Testing state transitions and optimistic concurrency control versions.',
      });

    const inquiryId = createRes.body.inquiry.id;
    let currentVersion = createRes.body.inquiry.version; // Should be 1
    console.log(`[Setup] Created test inquiry #${inquiryId.slice(0, 8)} with status NEW, version ${currentVersion}`);

    // 3. Test Invalid Transition: NEW -> RESOLVED (Direct resolve not allowed)
    console.log('[1/5] Testing illegal transition (NEW -> RESOLVED, expected 422)...');
    const illegalResolveRes = await request(app)
      .patch(`/api/inquiries/${inquiryId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'RESOLVED',
        version: currentVersion,
      });

    if (
      illegalResolveRes.status === 422 &&
      illegalResolveRes.body.error?.code === 'INVALID_STATUS_TRANSITION' &&
      illegalResolveRes.body.error?.message.includes('Cannot transition directly from NEW to RESOLVED')
    ) {
      console.log('✓ Rejected illegal transition (NEW -> RESOLVED) with 422 Unprocessable Content!');
      console.log(`  Message: "${illegalResolveRes.body.error.message}"`);
    } else {
      throw new Error(`Expected 422 INVALID_STATUS_TRANSITION, got: ${illegalResolveRes.status} ${JSON.stringify(illegalResolveRes.body)}`);
    }

    // 4. Test Valid Transition: NEW -> IN_PROGRESS
    console.log('[2/5] Testing legal transition (NEW -> IN_PROGRESS, expected 200 + version increment)...');
    const inProgressRes = await request(app)
      .patch(`/api/inquiries/${inquiryId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'IN_PROGRESS',
        version: currentVersion,
      });

    if (
      inProgressRes.status === 200 &&
      inProgressRes.body.inquiry?.status === 'IN_PROGRESS' &&
      inProgressRes.body.inquiry?.version === 2
    ) {
      console.log('✓ Status moved to IN_PROGRESS. Version incremented from 1 to 2.');
      currentVersion = inProgressRes.body.inquiry.version;
    } else {
      throw new Error(`Expected 200 and version 2, got: ${inProgressRes.status} ${JSON.stringify(inProgressRes.body)}`);
    }

    // 5. Test Real-World Situation 2: Stale Data Concurrency (Tab B has older version 1)
    console.log('[3/5] Testing Real-World Situation 2: Stale data update attempt (expected 409 Conflict)...');
    const staleUpdateRes = await request(app)
      .patch(`/api/inquiries/${inquiryId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'RESOLVED',
        version: 1, // Stale version! (DB is already at version 2)
      });

    if (
      staleUpdateRes.status === 409 &&
      staleUpdateRes.body.error?.code === 'STALE_DATA_CONFLICT' &&
      staleUpdateRes.body.error?.details?.currentVersion === 2
    ) {
      console.log('✓ Stale data update blocked with 409 Conflict!');
      console.log(`  Reported current version: ${staleUpdateRes.body.error.details.currentVersion}, status: ${staleUpdateRes.body.error.details.currentStatus}`);
      console.log(`  Message: "${staleUpdateRes.body.error.message}"`);
    } else {
      throw new Error(`Expected 409 STALE_DATA_CONFLICT, got: ${staleUpdateRes.status} ${JSON.stringify(staleUpdateRes.body)}`);
    }

    // 6. Test Valid Transition: IN_PROGRESS -> RESOLVED
    console.log('[4/5] Testing legal transition (IN_PROGRESS -> RESOLVED with valid version 2)...');
    const resolveRes = await request(app)
      .patch(`/api/inquiries/${inquiryId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'RESOLVED',
        version: currentVersion,
      });

    if (
      resolveRes.status === 200 &&
      resolveRes.body.inquiry?.status === 'RESOLVED' &&
      resolveRes.body.inquiry?.version === 3 &&
      resolveRes.body.inquiry?.resolvedAt
    ) {
      console.log('✓ Status moved to RESOLVED. Version incremented to 3. resolvedAt recorded.');
      currentVersion = resolveRes.body.inquiry.version;
    } else {
      throw new Error(`Expected 200 and version 3, got: ${resolveRes.status} ${JSON.stringify(resolveRes.body)}`);
    }

    // 7. Test Reopening Resolved Inquiry: RESOLVED -> IN_PROGRESS
    console.log('[5/5] Testing reopening inquiry (RESOLVED -> IN_PROGRESS, expected 200)...');
    
    // First, verify RESOLVED -> NEW is rejected
    const illegalReopenRes = await request(app)
      .patch(`/api/inquiries/${inquiryId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'NEW',
        version: currentVersion,
      });
    if (illegalReopenRes.status === 422) {
      console.log('  ✓ Verified RESOLVED cannot transition straight back to NEW (422)');
    }

    // Then, test valid reopen to IN_PROGRESS
    const reopenRes = await request(app)
      .patch(`/api/inquiries/${inquiryId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'IN_PROGRESS',
        version: currentVersion,
      });

    if (
      reopenRes.status === 200 &&
      reopenRes.body.inquiry?.status === 'IN_PROGRESS' &&
      reopenRes.body.inquiry?.version === 4
    ) {
      console.log('✓ Successfully reopened inquiry to IN_PROGRESS! Version is now 4.');
    } else {
      throw new Error(`Expected 200 and version 4, got: ${reopenRes.status} ${JSON.stringify(reopenRes.body)}`);
    }

    console.log('\n--- ALL STEP 4 LIFECYCLE & CONCURRENCY TESTS PASSED! ---');
  } finally {
    await pool.end();
  }
};

runLifecycleSmokeTest().catch((err) => {
  console.error('Lifecycle smoke test failed:', err);
  process.exit(1);
});
