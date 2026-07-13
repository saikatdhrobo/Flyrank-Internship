const app = require('./app');
const config = require('./config');
const { initDb } = require('./db/db');

async function start() {
  await initDb();

  app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
