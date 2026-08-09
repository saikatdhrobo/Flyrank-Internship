const express = require('express');
const path = require('path');
const fs = require('fs');

const { 
  createReport, 
  getJobStatus, 
  listReports, 
  getLogs,
  listSchedules,
  triggerSchedule
} = require('./controllers/report.controller');
const { getDashboardStats } = require('./controllers/stats.controller');
const { startWorker } = require('./services/worker.service');
const { initScheduler } = require('./services/scheduler.service');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Serve static assets from src/public
app.use(express.static(path.join(__dirname, 'public')));

// Ensure exports folder exists and serve files from it at /exports
const exportsPath = path.resolve(__dirname, '../exports');
if (!fs.existsSync(exportsPath)) {
  fs.mkdirSync(exportsPath, { recursive: true });
}
app.use('/exports', express.static(exportsPath));

// API Routes
app.post('/api/reports', createReport);
app.get('/api/jobs/:id', getJobStatus);
app.get('/api/reports', listReports);
app.get('/api/stats', getDashboardStats);
app.get('/api/worker/logs', getLogs);
app.get('/api/schedules', listSchedules);
app.post('/api/schedules/trigger/:id', triggerSchedule);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`  FLYRANK PDF REPORT GENERATOR SERVER STARTED     `);
  console.log(`  URL: http://localhost:${PORT}                   `);
  console.log(`==================================================`);
  
  // Start background services
  startWorker();
  initScheduler();
});
