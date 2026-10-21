import request from 'supertest';
import app from '../server.js';
import { pool } from '../config/db.js';

const runInquirySmokeTest = async () => {
  console.log('--- Running Step 2: Inquiry Capture & Validation Smoke Test ---');

  try {
    // 1. Authenticate to get valid token
    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'agent1@coffeeninja.com',
      password: 'Password123!',
    });
    const token = loginRes.body.token;

    // 2. Test Real-World Situation 1: Missing or invalid information
    console.log('[1/4] Testing invalid submission rejection (expected 400 with field errors)...');
    const badRes = await request(app)
      .post('/api/inquiries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'A', // too short
        contactInfo: 'invalid-contact-format', // neither email nor valid phone
        subject: 'Hi', // too short
        description: 'Short', // too short
      });

    if (
      badRes.status === 400 &&
      badRes.body.error?.code === 'VALIDATION_ERROR' &&
      badRes.body.error?.fields?.customerName &&
      badRes.body.error?.fields?.contactInfo &&
      badRes.body.error?.fields?.subject &&
      badRes.body.error?.fields?.description
    ) {
      console.log('✓ API independently rejected bad data with structured 400 validation errors!');
      console.log('  Fields rejected:', Object.keys(badRes.body.error.fields).join(', '));
    } else {
      throw new Error(`Expected 400 VALIDATION_ERROR, got: ${badRes.status} ${JSON.stringify(badRes.body)}`);
    }

    // 3. Test Sri Lankan Phone Number Validation (0771234567 & +94771234567)
    console.log('[2/4] Testing Sri Lankan phone number validation (local 077... & international +9477...)...');
    
    // 3a. Invalid Sri Lankan phone (+94 with leading 0 e.g. +940771234567)
    const invalidSlRes = await request(app)
      .post('/api/inquiries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Invalid Tester',
        contactInfo: '+940771234567', // invalid leading 0 after +94
        subject: 'Testing leading 0 rejection',
        description: 'Should be rejected because +94 must be followed by 9 digits without leading 0.',
      });
    if (invalidSlRes.status === 400 && invalidSlRes.body.error?.fields?.contactInfo) {
      console.log('✓ Successfully rejected invalid phone (+94 with leading 0)');
    } else {
      throw new Error(`Expected 400 for invalid Sri Lankan phone, got ${invalidSlRes.status}`);
    }

    // 3b. Valid Sri Lankan local 10-digit number (0771234567)
    const slLocalRes = await request(app)
      .post('/api/inquiries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Kavindu Perera',
        contactInfo: '0771234567',
        subject: `Local Sri Lankan Number Test #${Date.now()}`,
        description: 'Customer requested a call back on their Dialog mobile connection.',
      });
    if (slLocalRes.status === 201 && slLocalRes.body.inquiry?.contactInfo === '0771234567') {
      console.log('✓ Successfully accepted Sri Lankan local 10-digit number (0771234567)');
    } else {
      throw new Error(`Failed to accept local Sri Lankan number: ${JSON.stringify(slLocalRes.body)}`);
    }

    // 3c. Valid Sri Lankan international number (+94771234567)
    const slIntlRes = await request(app)
      .post('/api/inquiries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Anura Kumara',
        contactInfo: '+94771234567',
        subject: `International Sri Lankan Number Test #${Date.now()}`,
        description: 'Customer reached out with international country code format.',
      });
    if (slIntlRes.status === 201 && slIntlRes.body.inquiry?.contactInfo === '+94771234567') {
      console.log('✓ Successfully accepted Sri Lankan international number (+94771234567)');
    } else {
      throw new Error(`Failed to accept international Sri Lankan number: ${JSON.stringify(slIntlRes.body)}`);
    }

    // 4. Test Duplicate Prevention Guard (Submitting same inquiry again within 10-minute window)
    console.log('[4/4] Testing duplicate inquiry guard within 10-minute window (expected 409 Conflict)...');
    const dupRes = await request(app)
      .post('/api/inquiries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerName: 'Anura Kumara',
        contactInfo: '+94771234567',
        subject: slIntlRes.body.inquiry.subject, // Same contact + subject
        description: 'Customer reached out with international country code format.',
      });

    if (dupRes.status === 409 && dupRes.body.error?.code === 'DUPLICATE_INQUIRY') {
      console.log('✓ Duplicate submission successfully guarded with 409 Conflict!');
      console.log(`  Message: ${dupRes.body.error.message}`);
    } else {
      throw new Error(`Expected 409 DUPLICATE_INQUIRY, got: ${dupRes.status} ${JSON.stringify(dupRes.body)}`);
    }

    console.log('\n--- ALL STEP 2 SRI LANKAN CONTACT & VALIDATION TESTS PASSED! ---');
  } finally {
    await pool.end();
  }
};

runInquirySmokeTest().catch((err) => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
