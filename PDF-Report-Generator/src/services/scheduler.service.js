const cron = require('node-cron');
const crypto = require('crypto');
const db = require('../db/database');
const { logWorker } = require('./worker.service');

// Store running cron tasks in memory
const runningTasks = {};

/**
 * Queue a new report generation job in the database.
 * @param {string} type - Job type (e.g. 'sales_report')
 * @returns {string} - The generated Job ID
 */
function queueJob(type) {
  const jobId = crypto.randomUUID();
  const now = new Date().toISOString();
  
  db.prepare(`
    INSERT INTO jobs (id, type, status, progress, created_at, updated_at)
    VALUES (?, ?, 'pending', 0, ?, ?)
  `).run(jobId, type, now, now);
  
  return jobId;
}

/**
 * Initialize and start all active schedules from the database.
 */
function initScheduler() {
  try {
    // Fetch active schedules
    const schedules = db.prepare('SELECT * FROM schedules WHERE active = 1').all();
    
    logWorker(`Initializing scheduler. Found ${schedules.length} active schedules.`, 'info');
    
    // Clear any existing running tasks
    stopAllSchedules();

    schedules.forEach(schedule => {
      const { id, name, cron_expression } = schedule;
      
      // Validate cron expression
      if (!cron.validate(cron_expression)) {
        logWorker(`Invalid cron expression for schedule "${name}" (${id}): ${cron_expression}`, 'error');
        return;
      }
      
      logWorker(`Scheduling "${name}" with cron: [${cron_expression}]`, 'info');
      
      // Schedule the task
      const task = cron.schedule(cron_expression, () => {
        logWorker(`Clock fired! Scheduled task "${name}" running...`, 'info');
        
        try {
          const jobId = queueJob('sales_report');
          const nowStr = new Date().toISOString();
          
          // Update last run time in DB
          db.prepare(`
            UPDATE schedules 
            SET last_run = ? 
            WHERE id = ?
          `).run(nowStr, id);
          
          logWorker(`Automated job queued by schedule "${name}" (Job ID: ${jobId})`, 'success');
        } catch (err) {
          logWorker(`Failed to run scheduled task "${name}": ${err.message}`, 'error');
        }
      });
      
      // Keep track of the task object
      runningTasks[id] = task;
    });

  } catch (error) {
    logWorker(`Scheduler initialization failed: ${error.message}`, 'error');
  }
}

/**
 * Stop all scheduled cron tasks.
 */
function stopAllSchedules() {
  Object.keys(runningTasks).forEach(id => {
    runningTasks[id].stop();
    delete runningTasks[id];
  });
}

module.exports = {
  initScheduler,
  stopAllSchedules,
  queueJob
};
