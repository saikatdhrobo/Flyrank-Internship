-- ============================================================
-- Stage 4 — Manual SQL exploration
-- Run these queries in any SQLite viewer (DB Browser for SQLite
-- is recommended) against the tasks.db file in the project root.
-- ============================================================

-- List every task
SELECT * FROM tasks;

-- Show only completed tasks
SELECT * FROM tasks WHERE done = 1;

-- Count all tasks
SELECT COUNT(*) FROM tasks;

-- Mark every task as completed
UPDATE tasks SET done = 1;

-- Delete all completed tasks
DELETE FROM tasks WHERE done = 1;
