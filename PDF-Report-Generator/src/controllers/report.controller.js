const db = require('../db/database');
const { queueJob } = require('../services/scheduler.service');
const { getWorkerLogs, logWorker } = require('../services/worker.service');

/**
 * Trigger report generation (creates a background job).
 * POST /api/reports
 */
function createReport(req, res) {
  try {
    const jobId = queueJob('sales_report');
    logWorker(`User requested manual report generation. Job ${jobId} queued.`, 'info');
    
    return res.status(202).json({
      success: true,
      jobId,
      status: 'pending',
      message: 'Report generation queued successfully as a background job.'
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Check the status of a specific background job.
 * GET /api/jobs/:id
 */
function getJobStatus(req, res) {
  try {
    const { id } = req.params;
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json({
      jobId: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      result_url: job.result_url,
      error: job.error,
      created_at: job.created_at,
      updated_at: job.updated_at
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * List all historical completed reports.
 * GET /api/reports
 */
function listReports(req, res) {
  try {
    const reports = db.prepare(`
      SELECT * FROM jobs 
      WHERE status = 'completed' 
      ORDER BY updated_at DESC
    `).all();

    return res.status(200).json(reports);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get background worker execution trace logs.
 * GET /api/worker/logs
 */
function getLogs(req, res) {
  try {
    const logs = getWorkerLogs();
    return res.status(200).json(logs);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Get list of schedules.
 * GET /api/schedules
 */
function listSchedules(req, res) {
  try {
    const schedules = db.prepare('SELECT * FROM schedules').all();
    return res.status(200).json(schedules);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

/**
 * Trigger a schedule manually.
 * POST /api/schedules/trigger/:id
 */
function triggerSchedule(req, res) {
  try {
    const { id } = req.params;
    const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(id);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    const jobId = queueJob('sales_report');
    const nowStr = new Date().toISOString();
    
    db.prepare('UPDATE schedules SET last_run = ? WHERE id = ?').run(nowStr, id);
    logWorker(`Schedule "${schedule.name}" triggered manually by client (Job ID: ${jobId})`, 'info');

    return res.status(202).json({
      success: true,
      jobId,
      message: `Schedule "${schedule.name}" triggered manually.`
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

module.exports = {
  createReport,
  getJobStatus,
  listReports,
  getLogs,
  listSchedules,
  triggerSchedule
};
