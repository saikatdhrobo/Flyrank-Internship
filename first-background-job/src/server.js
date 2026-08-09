require('dotenv').config();
const express = require('express');
const path = require('path');
const { initDb, createJob, getJob, getJobs, getAlerts, updateJob, clearAll } = require('./db');
const { startWorker, stopWorker } = require('./worker');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initDb();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

/**
 * Endpoint to submit a background job.
 * Handled with 202 Accepted for new/processing jobs.
 */
app.post('/api/jobs', (req, res) => {
  const { query, prompt, maxRetries, forceFail } = req.body;
  const idempotencyKey = req.headers['x-idempotency-key'];

  // Input validation
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return res.status(400).json({ error: 'Query is required and must be a valid string.' });
  }
  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ error: 'Criteria prompt is required and must be a valid string.' });
  }

  const retriesLimit = maxRetries !== undefined ? parseInt(maxRetries, 10) : 3;

  try {
    const { job, isDuplicate } = createJob(
      query.trim(),
      prompt.trim(),
      idempotencyKey ? idempotencyKey.trim() : null,
      retriesLimit,
      !!forceFail
    );

    const responsePayload = {
      job_id: job.id,
      status: job.status,
      progress: job.progress,
      status_url: `/api/jobs/${job.id}`,
      is_duplicate: isDuplicate,
      job: job
    };

    if (isDuplicate) {
      console.log(`[Server] Idempotency Hit for key "${idempotencyKey}". Job: ${job.id}`);
      
      // If the duplicate job is completed or failed, return 200 OK
      if (job.status === 'completed' || job.status === 'failed') {
        return res.status(200).json(responsePayload);
      }
    } else {
      console.log(`[Server] Queued new job: ${job.id} (Idempotency Key: ${idempotencyKey || 'None'})`);
    }

    // Default response for processing/pending jobs is 202 Accepted
    return res.status(202).json(responsePayload);

  } catch (error) {
    console.error('[Server] Job creation error:', error);
    return res.status(500).json({ error: 'Internal server error occurred while queuing job.' });
  }
});

/**
 * Get job status by ID.
 */
app.get('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  try {
    const job = getJob(id);
    if (!job) {
      return res.status(404).json({ error: `Job with ID ${id} not found.` });
    }
    return res.status(200).json(job);
  } catch (error) {
    console.error('[Server] Get job error:', error);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

/**
 * Get all jobs list.
 */
app.get('/api/jobs', (req, res) => {
  try {
    const jobs = getJobs();
    return res.status(200).json(jobs);
  } catch (error) {
    console.error('[Server] Get jobs error:', error);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

/**
 * Get all failure alerts.
 */
app.get('/api/alerts', (req, res) => {
  try {
    const alerts = getAlerts();
    return res.status(200).json(alerts);
  } catch (error) {
    console.error('[Server] Get alerts error:', error);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

/**
 * Manually retry a permanently failed job.
 */
app.post('/api/jobs/:id/retry', (req, res) => {
  const { id } = req.params;
  try {
    const job = getJob(id);
    if (!job) {
      return res.status(404).json({ error: `Job ${id} not found.` });
    }
    if (job.status !== 'failed') {
      return res.status(400).json({ error: `Job ${id} is not in a failed state (Current status: ${job.status}).` });
    }

    // Reset status back to pending, clear error and reset retries
    const updatedJob = updateJob(id, {
      status: 'pending',
      progress: 0,
      retries: 0,
      error: null
    });

    console.log(`[Server] Manually re-queued failed job: ${id}`);
    return res.status(200).json(updatedJob);
  } catch (error) {
    console.error('[Server] Retry job error:', error);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

/**
 * Clear queue and alerts (for testing/cleanup).
 */
app.post('/api/clear', (req, res) => {
  try {
    clearAll();
    console.log('[Server] Database cleared (jobs and alerts).');
    return res.status(200).json({ message: 'Database cleared successfully.' });
  } catch (error) {
    console.error('[Server] Clear database error:', error);
    return res.status(500).json({ error: 'Internal server error occurred.' });
  }
});

// Start the Express server and the background worker
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  
  // Start the background worker polling loop
  startWorker();
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received. Shutting down gracefully...');
  stopWorker();
  server.close(() => {
    console.log('Http server closed.');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received. Shutting down gracefully...');
  stopWorker();
  server.close(() => {
    console.log('Http server closed.');
  });
});
