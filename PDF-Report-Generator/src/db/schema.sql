-- Database schema for PDF Report Generator

-- Sales transactions table
CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT NOT NULL,
  amount REAL NOT NULL,
  quantity INTEGER NOT NULL,
  order_date TEXT NOT NULL
);

-- Background jobs table
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER NOT NULL DEFAULT 0,
  result_url TEXT,
  error TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Scheduled tasks table
CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  cron_expression TEXT NOT NULL,
  last_run TEXT,
  next_run TEXT,
  active INTEGER NOT NULL DEFAULT 1
);
