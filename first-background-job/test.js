/**
 * Automated Validation Script for BE-06 Background Job Queue
 * 
 * Assumes the server is running on http://localhost:3000.
 * If server is not running, it will prompt to start it.
 */

const BASE_URL = 'http://localhost:3000';

// Helper for delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runTests() {
  console.log('=====================================================');
  console.log('STARTING INTEGRATION TESTS FOR BACKGROUND JOB QUEUE...');
  console.log('=====================================================');

  try {
    // 0. Reset Database
    console.log('\n[Setup] Resetting database...');
    const clearRes = await fetch(`${BASE_URL}/api/clear`, { method: 'POST' });
    if (!clearRes.ok) {
      throw new Error('Could not reset database. Is the server running?');
    }
    console.log('✓ Database cleared.');

    // 1. Queue a Standard Job (will succeed)
    console.log('\n[Test 1] Queuing a standard success job...');
    const job1Res = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'Can you refund my subscription? The service is not working.',
        prompt: 'Is the user requesting a refund or billing support?',
        maxRetries: 3,
        forceFail: false
      })
    });

    if (job1Res.status !== 202) {
      throw new Error(`Expected 202 Accepted, got ${job1Res.status}`);
    }

    const job1Data = await job1Res.json();
    const job1Id = job1Data.job_id;
    console.log(`✓ Job 1 Queued successfully. ID: ${job1Id}`);

    // Wait and verify job progresses and finishes
    console.log('Waiting for Job 1 to process...');
    let job1Finished = false;
    for (let i = 0; i < 6; i++) {
      await delay(1000);
      const statusRes = await fetch(`${BASE_URL}/api/jobs/${job1Id}`);
      const job = await statusRes.json();
      console.log(`  - Job Status: ${job.status} (Progress: ${job.progress}%)`);
      if (job.status === 'completed') {
        console.log(`✓ Job 1 completed. Result decision: ${job.result.decision}`);
        job1Finished = true;
        break;
      }
    }
    if (!job1Finished) {
      throw new Error('Job 1 did not complete in time.');
    }

    // 2. Test Idempotency Check
    console.log('\n[Test 2] Testing idempotency keys...');
    const idempotencyKey = `test-key-${Date.now()}`;
    const payload = {
      query: 'I need technical assistance to configure my account.',
      prompt: 'Is the user requesting support or help?',
      maxRetries: 3
    };

    console.log('Sending first request with idempotency key...');
    const req1 = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-idempotency-key': idempotencyKey
      },
      body: JSON.stringify(payload)
    });
    const data1 = await req1.json();
    console.log(`  - First request queued Job ID: ${data1.job_id} (is_duplicate: ${data1.is_duplicate})`);

    console.log('Sending duplicate request with same idempotency key...');
    const req2 = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-idempotency-key': idempotencyKey
      },
      body: JSON.stringify(payload)
    });
    const data2 = await req2.json();
    console.log(`  - Second request returned Job ID: ${data2.job_id} (is_duplicate: ${data2.is_duplicate})`);

    if (data1.job_id !== data2.job_id) {
      throw new Error('Deduplication failed! Different Job IDs returned for same key.');
    }
    if (data2.is_duplicate !== true) {
      throw new Error('Expected is_duplicate to be true on second call.');
    }
    console.log('✓ Idempotency and deduplication verified.');

    // 3. Test Retries and Failure Alerting
    console.log('\n[Test 3] Testing retries and error alerts...');
    const failedJobRes = await fetch(`${BASE_URL}/api/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: 'I want to schedule an enterprise sales demo.',
        prompt: 'Is the user interested in purchasing or licensing?',
        maxRetries: 2, // Low retry count for faster test
        forceFail: true // Forces LLM call to fail
      })
    });

    const failedJobData = await failedJobRes.json();
    const failedJobId = failedJobData.job_id;
    console.log(`✓ Forced fail Job Queued. ID: ${failedJobId}`);

    // Wait and watch retries (Attempt 1, Attempt 2, then Permanent Failure)
    console.log('Waiting for retries to run (should take around 10-15 seconds)...');
    let jobFailedPermanently = false;
    for (let i = 0; i < 25; i++) {
      await delay(1000);
      const statusRes = await fetch(`${BASE_URL}/api/jobs/${failedJobId}`);
      const job = await statusRes.json();
      console.log(`  - Job Status: ${job.status} (Attempts: ${job.retries}/${job.max_retries})`);
      if (job.status === 'failed') {
        console.log(`✓ Job permanently failed. Error logged: "${job.error.substring(0, 70)}..."`);
        jobFailedPermanently = true;
        break;
      }
    }
    
    if (!jobFailedPermanently) {
      throw new Error('Job did not reach permanent failure in time.');
    }

    // 4. Verify system alert is logged
    console.log('\n[Test 4] Verifying alert webhook/database logging...');
    const alertsRes = await fetch(`${BASE_URL}/api/alerts`);
    const alerts = await alertsRes.json();
    
    console.log(`Found ${alerts.length} active alerts in database.`);
    const matchingAlert = alerts.find(a => a.job_id === failedJobId);
    
    if (!matchingAlert) {
      throw new Error('Alert was not found in alerts log for failed job.');
    }
    console.log(`✓ Alert verified: "${matchingAlert.message}"`);

    console.log('\n=====================================================');
    console.log('ALL TESTS PASSED SUCCESSFULLY! BACKGROUND JOB QUEUE OK');
    console.log('=====================================================');

  } catch (error) {
    console.error('\n❌ TEST RUN FAILED:', error.message);
    process.exit(1);
  }
}

runTests();
