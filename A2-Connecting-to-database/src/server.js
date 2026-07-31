const app = require('./app');
const config = require('./config');
const { initDb } = require('./db/db');

// Create the tasks table and seed example tasks (only on the first run).
initDb();

app.listen(config.port, () => {
  console.log(`Server listening at http://localhost:${config.port}`);
});
