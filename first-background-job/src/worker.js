const { getPendingJob, getJob, updateJob, createAlert } = require('./db');
const { evaluateDecision } = require('./llm');

let workerInterval = null;
let isPolling = false;

// Configurable polling interval
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL_MS || '2000', 10);
const RETRY_COOL_DOWN_MS = 3000; // Cool down period before retrying a failed job

/**
 * Promisified delay helper.
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Processes a single background job.
 * @param {object} job 
 */
async function processJob(job) {
  const jobId = job.id;
  try {
    console.log(`[Worker] Started processing job ${jobId}`);
    
    // Step 1: Mark job as processing
    updateJob(jobId, { status: 'processing', progress: 15, error: null });
    await delay(800); // Simulate processing latency

    // Step 2: Update progress to indicate LLM execution has started
    updateJob(jobId, { progress: 50 });
    
    // Run the AI Call (using llm.js)
    // Pass force_fail flag if it was set in input
    const forceFail = job.input.forceFail || false;
    const result = await evaluateDecision(job.input.query, job.input.prompt, forceFail);

    // Step 3: Complete the job
    updateJob(jobId, {
      status: 'completed',
      progress: 100,
      result: { decision: result }
    });
    console.log(`[Worker] Job ${jobId} completed successfully with result: ${result}`);

  } catch (error) {
    const nextRetryCount = job.retries + 1;
    const maxRetries = job.max_retries;
    const errorMessage = error.message || String(error);

    console.error(`[Worker] Error processing job ${jobId} (Attempt ${nextRetryCount}/${maxRetries}): ${errorMessage}`);

    if (nextRetryCount < maxRetries) {
      // Transition to 'retrying' cooling down state
      updateJob(jobId, {
        status: 'retrying',
        progress: 50,
        retries: nextRetryCount,
        error: `Attempt ${nextRetryCount} failed: ${errorMessage}`
      });

      console.log(`[Worker] Cooling down job ${jobId} for ${RETRY_COOL_DOWN_MS}ms before retry...`);

      // After cool down, set back to pending so worker can pick it up again
      setTimeout(() => {
        try {
          const currentJob = getJob(jobId);
          // Only put back to pending if it's still in retrying state (e.g. wasn't canceled/reset)
          if (currentJob && currentJob.status === 'retrying') {
            updateJob(jobId, { status: 'pending' });
            console.log(`[Worker] Job ${jobId} cooling down complete. Re-queued as pending.`);
          }
        } catch (e) {
          console.error(`[Worker] Failed to re-queue job ${jobId}:`, e.message);
        }
      }, RETRY_COOL_DOWN_MS);

    } else {
      // Mark permanently failed
      updateJob(jobId, {
        status: 'failed',
        progress: 100,
        retries: nextRetryCount,
        error: `Permanently failed after ${maxRetries} attempts. Last error: ${errorMessage}`
      });

      // Trigger an Alert
      const alertMsg = `Job ${jobId} (Query: "${job.input.query.substring(0, 40)}...") permanently failed after ${maxRetries} retries. Error: ${errorMessage}`;
      createAlert(jobId, alertMsg);

      console.error(`[Worker] ALERT: ${alertMsg}`);
    }
  }
}

/**
 * Polling loop to find and execute pending jobs.
 */
async function pollForJobs() {
  if (isPolling) return;
  isPolling = true;

  try {
    const pendingJob = getPendingJob();
    if (pendingJob) {
      console.log(`[Worker] Found pending job: ${pendingJob.id}`);
      await processJob(pendingJob);
    }
  } catch (error) {
    console.error('[Worker] Polling loop error:', error);
  } finally {
    isPolling = false;
  }
}

/**
 * Starts the worker polling interval.
 */
function startWorker() {
  if (workerInterval) {
    console.log('[Worker] Background worker already running.');
    return;
  }
  console.log(`[Worker] Background worker started. Polling interval: ${POLL_INTERVAL}ms`);
  workerInterval = setInterval(pollForJobs, POLL_INTERVAL);
}

/**
 * Stops the worker polling interval.
 */
function stopWorker() {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log('[Worker] Background worker stopped.');
  }
}

module.exports = {
  startWorker,
  stopWorker
};
