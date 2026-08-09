const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables (db path)
const dbPath = path.resolve(process.env.DB_PATH || './jobs.json');

/**
 * Initializes the database file if it does not exist.
 */
function initDb() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(dbPath)) {
    const defaultData = { jobs: [], alerts: [] };
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
  }
}

/**
 * Reads database contents.
 * @returns {object}
 */
function readDb() {
  try {
    initDb();
    const data = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading JSON database:', error);
    return { jobs: [], alerts: [] };
  }
}

/**
 * Writes database contents atomically.
 * @param {object} data 
 */
function writeDb(data) {
  try {
    // Write to a temporary file first, then rename it (atomic write pattern)
    const tempPath = dbPath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempPath, dbPath);
  } catch (error) {
    console.error('Error writing JSON database:', error);
  }
}

/**
 * Creates a job or returns an existing one if idempotency key matches.
 */
function createJob(query, prompt, idempotencyKey, maxRetries = 3, forceFail = false) {
  const db = readDb();
  
  // Idempotency check
  if (idempotencyKey) {
    const existing = db.jobs.find(j => j.idempotency_key === idempotencyKey);
    if (existing) {
      return { job: existing, isDuplicate: true };
    }
  }

  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();
  
  const newJob = {
    id: jobId,
    idempotency_key: idempotencyKey || null,
    status: 'pending',
    progress: 0,
    input: { query, prompt, forceFail },
    result: null,
    error: null,
    retries: 0,
    max_retries: maxRetries,
    created_at: now,
    updated_at: now
  };

  db.jobs.push(newJob);
  writeDb(db);

  return { job: newJob, isDuplicate: false };
}

/**
 * Finds a job by ID.
 */
function getJob(id) {
  const db = readDb();
  return db.jobs.find(j => j.id === id) || null;
}

/**
 * Gets the oldest pending job.
 */
function getPendingJob() {
  const db = readDb();
  return db.jobs.find(j => j.status === 'pending') || null;
}

/**
 * Updates an existing job's state.
 */
function updateJob(id, updates) {
  const db = readDb();
  const index = db.jobs.findIndex(j => j.id === id);
  if (index === -1) {
    throw new Error(`Job ${id} not found.`);
  }

  db.jobs[index] = {
    ...db.jobs[index],
    ...updates,
    updated_at: new Date().toISOString()
  };

  writeDb(db);
  return db.jobs[index];
}

/**
 * Gets all jobs.
 */
function getJobs() {
  const db = readDb();
  // Return reversed so newest jobs are first in UI
  return [...db.jobs].reverse();
}

/**
 * Creates an alert.
 */
function createAlert(jobId, message) {
  const db = readDb();
  const now = new Date().toISOString();
  const newAlert = {
    id: crypto.randomUUID(),
    job_id: jobId,
    message,
    created_at: now
  };
  db.alerts.push(newAlert);
  writeDb(db);
  return newAlert;
}

/**
 * Gets all alerts.
 */
function getAlerts() {
  const db = readDb();
  return [...db.alerts].reverse();
}

/**
 * Clears all data (useful for test resets).
 */
function clearAll() {
  writeDb({ jobs: [], alerts: [] });
}

module.exports = {
  initDb,
  createJob,
  getJob,
  getPendingJob,
  updateJob,
  getJobs,
  createAlert,
  getAlerts,
  clearAll
};
