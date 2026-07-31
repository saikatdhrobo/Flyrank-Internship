# A2 — Connecting to the Database

A CRUD task API backed by **SQLite**. This is the follow-up to the in-memory
assignment: the API endpoints behave exactly the same, but tasks now live in a
real database and **survive server restarts**.

```
Client → API → SQLite database (tasks.db)
```

## Why SQLite?

- **Zero setup** — SQLite is a lightweight database stored in a single file. No
  database server to install, configure, or run.
- **Perfect for learning** — the same SQL you write here (`SELECT`, `INSERT`,
  `UPDATE`, `DELETE`) works on PostgreSQL, MySQL, and other relational
  databases. Only the storage layer changes; the API stays the same.
- **File-based** — the whole database is one portable file, easy to inspect
  with a SQLite viewer and easy to back up.

## Where the database lives

The database is stored in a single file: **`tasks.db`** in the project root.

It is created automatically the first time the server starts. On that first
run the `tasks` table is created (if missing) and **three example tasks are
inserted** — but only when the table is empty, so restarting never duplicates
them.

> The `tasks.db` file is git-ignored on purpose: anyone cloning the repository
> gets the database for free on their first `npm start`.

## Requirements

- Node.js 18+
- npm

## How to start

```bash
npm install
npm start
```

The server listens on `http://localhost:3000` (override with the `PORT`
environment variable).

## Endpoints

| Method   | URL            | Description                        | Success | Errors                      |
| -------- | -------------- | ---------------------------------- | ------- | --------------------------- |
| `GET`    | `/tasks`       | List all tasks                     | `200`   | —                           |
| `GET`    | `/tasks/:id`   | Get one task                       | `200`   | `404` unknown id, `400` bad id |
| `POST`   | `/tasks`       | Create a task (`title`, optional `done`) | `201`   | `400` missing/empty title   |
| `PUT`    | `/tasks/:id`   | Update a task (`title` and/or `done`)    | `200`   | `404` unknown id, `400` invalid input |
| `DELETE` | `/tasks/:id`   | Delete a task                      | `200`   | `404` unknown id            |
| `GET`    | `/stats`       | Task counts                        | `200`   | —                           |
| `GET`    | `/health`      | Health check                       | `200`   | —                           |

Error responses use the same shape as before:

```json
{ "error": "Task not found" }
```

### Examples

```bash
# List tasks
curl http://localhost:3000/tasks

# Create a task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title":"Buy milk"}'

# Update a task
curl -X PUT http://localhost:3000/tasks/1 \
  -H "Content-Type: application/json" \
  -d '{"done":true}'

# Delete a task
curl -X DELETE http://localhost:3000/tasks/1

# Stats (counted in SQL, not JavaScript)
curl http://localhost:3000/stats
```

## Extra features (optional extras)

| Feature                    | Example request                        | SQL behind it                     |
| -------------------------- | -------------------------------------- | --------------------------------- |
| Search by title            | `GET /tasks?search=milk`               | `WHERE title LIKE '%milk%'`       |
| Filter by completion       | `GET /tasks?done=true`                 | `WHERE done = 1`                  |
| Sort alphabetically        | `GET /tasks?sort=title`                | `ORDER BY title COLLATE NOCASE`   |
| Statistics                 | `GET /stats`                           | `SELECT COUNT(*) FROM tasks`      |

## Exploring the database manually (Stage 4)

Open `tasks.db` with any SQLite viewer (e.g. DB Browser for SQLite) and run
the queries in [`sql/queries.sql`](sql/queries.sql):

```sql
-- List every task
SELECT * FROM tasks;

-- Show only completed tasks
SELECT * FROM tasks WHERE done = 1;

-- Count all tasks
SELECT COUNT(*) FROM tasks;
```

Changes you make manually are immediately visible through the API — the API
reads straight from the same database file.

## Project structure

```
A2-Connecting-to-database/
├── sql/
│   └── queries.sql          # Manual SQL exercises from Stage 4
├── src/
│   ├── app.js               # Express app (middleware, routes, error handling)
│   ├── server.js            # Entry point: init DB, then listen
│   ├── config/              # Port + database file path
│   ├── controllers/         # Request/response handling
│   ├── db/                  # SQLite connection, table creation, seeding
│   ├── repositories/        # SQL layer (SQLite) + the interface it implements
│   ├── routes/              # /tasks and /stats routes
│   └── services/            # Business logic (validation, 400/404 rules)
└── tasks.db                 # Created automatically on first run (git-ignored)
```

The API layer (controllers, services) never touches SQL directly — it depends
on the repository interface, so swapping SQLite for PostgreSQL later only
means writing one new repository class.
