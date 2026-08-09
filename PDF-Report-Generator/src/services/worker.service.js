const path = require('path');
const fs = require('fs');
const db = require('../db/database');
const { generateSalesReportPDF } = require('./pdf.service');

// Constants
const POLL_INTERVAL_MS = 3000; // Poll database every 3 seconds
const EXPORTS_DIR = path.resolve(__dirname, '../../exports');

// Worker execution state
let isPolling = false;
let pollingTimer = null;
const workerLogs = [];

function logWorker(msg, type = 'info') {
  const timestamp = new Date().toISOString();
  const formattedLog = `[${timestamp}] [${type.toUpperCase()}] ${msg}`;
  console.log(formattedLog);
  workerLogs.push({ timestamp, type, message: msg });
  // Cap logs to 100 entries to prevent memory leak
  if (workerLogs.length > 100) {
    workerLogs.shift();
  }
}

/**
 * Update the state of a job in the database.
 */
function updateJobState(jobId, updates) {
  const fields = Object.keys(updates);
  const assignments = fields.map(field => `${field} = ?`).join(', ');
  const values = Object.values(updates);
  
  const query = `
    UPDATE jobs 
    SET ${assignments}, updated_at = ?
    WHERE id = ?
  `;
  
  db.prepare(query).run(...values, new Date().toISOString(), jobId);
}

/**
 * Process a single PDF report generation job.
 */
async function processJob(job) {
  const jobId = job.id;
  const fileName = `sales-report-${jobId}.pdf`;
  const filePath = path.join(EXPORTS_DIR, fileName);
  const fileUrl = `/exports/${fileName}`;

  try {
    logWorker(`Starting job ${jobId}...`, 'info');
    
    // Step 1: Mark as processing
    updateJobState(jobId, { status: 'processing', progress: 10 });
    await delay(1000); // Small delay to show progress states
    
    // Step 2: Querying data aggregation
    logWorker(`[Job ${jobId}] Running SQL aggregations...`, 'info');
    updateJobState(jobId, { progress: 40 });
    await delay(1000);

    // Step 3: Generating PDF
    logWorker(`[Job ${jobId}] Rendering PDFKit layouts...`, 'info');
    updateJobState(jobId, { progress: 75 });
    
    await generateSalesReportPDF(filePath);
    
    logWorker(`[Job ${jobId}] Saving PDF file to exports...`, 'info');
    updateJobState(jobId, { progress: 90 });
    await delay(800);

    // Step 4: Finished
    updateJobState(jobId, { 
      status: 'completed', 
      progress: 100, 
      result_url: fileUrl 
    });
    
    logWorker(`Job ${jobId} finished successfully! Report saved to ${fileUrl}`, 'success');

  } catch (error) {
    const errorMsg = error.message || String(error);
    logWorker(`Job ${jobId} failed: ${errorMsg}`, 'error');
    
    updateJobState(jobId, { 
      status: 'failed', 
      progress: 100, 
      error: errorMsg 
    });
  }
}

/**
 * Poll database for pending jobs.
 */
async function pollForJobs() {
  if (isPolling) return;
  isPolling = true;

  try {
    // Find oldest pending job
    const job = db.prepare(`
      SELECT * FROM jobs 
      WHERE status = 'pending' 
      ORDER BY created_at ASC 
      LIMIT 1
    `).get();

    if (job) {
      logWorker(`Found pending job ${job.id}. Starting execution.`, 'info');
      await processJob(job);
    }
  } catch (error) {
    logWorker(`Worker polling loop error: ${error.message}`, 'error');
  } finally {
    isPolling = false;
  }
}

/**
 * Start the background worker polling loop.
 */
function startWorker() {
  // Ensure exports directory exists
  if (!fs.existsSync(EXPORTS_DIR)) {
    fs.mkdirSync(EXPORTS_DIR, { recursive: true });
  }

  if (pollingTimer) {
    logWorker('Worker is already running.', 'warning');
    return;
  }

  logWorker('Background worker started. Polling SQLite database...', 'info');
  pollingTimer = setInterval(pollForJobs, POLL_INTERVAL_MS);
}

/**
 * Stop the background worker.
 */
function stopWorker() {
  if (pollingTimer) {
    clearInterval(pollingTimer);
    pollingTimer = null;
    logWorker('Background worker stopped.', 'info');
  }
}

// Helper: Promisified timeout
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  startWorker,
  stopWorker,
  getWorkerLogs: () => workerLogs,
  logWorker
};
