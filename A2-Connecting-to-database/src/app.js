const express = require('express');
const taskRoutes = require('./routes/task.routes');
const statsRoutes = require('./routes/stats.routes');

const app = express();

app.use(express.json());

app.use('/tasks', taskRoutes);
app.use('/stats', statsRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  console.error(`[ERROR] ${status} - ${message}`);
  res.status(status).json({ error: message });
});

module.exports = app;
