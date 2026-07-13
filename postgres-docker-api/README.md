# Postgres Docker API

A production-quality Node.js REST API backed by PostgreSQL running in Docker.  
Built with a clean **layered architecture** so the storage engine can be swapped
without touching business logic.

---

## Architecture

```
src/
  app.js              Express app setup (middleware, routes, error handlers)
  server.js           Server entry-point; waits for DB then starts listening

  routes/
    task.routes.js     Wire up repository → service → controller

  controllers/
    task.controller.js Parse HTTP requests, delegate to service, send responses

  services/
    task.service.js    Business logic & validation (storage-agnostic)

  repositories/
    repository.interface.js   Abstract contract (interface)
    postgres.repository.js    PostgreSQL implementation

  db/
    db.js              pg Pool & connection helpers
    init.sql           CREATE TABLE statement (auto-run via Docker entry-point)

  config/
    index.js           Centralised environment-variable access
```

### Why only the repository changes

The **Service** never touches the database directly — it calls methods on a
`RepositoryInterface`.  The **Controller** never touches the database either;
it only calls the service.

When you need to switch to a different database (MySQL, SQLite, an in-memory
store, etc.) you write **one new class** that implements `RepositoryInterface`
and swap it in `routes/task.routes.js`.  Everything else stays the same.

---

## API Endpoints

| Method | Path             | Description        | Status codes           |
|--------|------------------|--------------------|------------------------|
| GET    | `/tasks`         | List all tasks     | 200                    |
| GET    | `/tasks/:id`     | Get a single task  | 200, 404               |
| POST   | `/tasks`         | Create a task      | 201, 400               |
| PUT    | `/tasks/:id`     | Update a task      | 200, 400, 404          |
| DELETE | `/tasks/:id`     | Delete a task      | 200, 400, 404          |
| GET    | `/health`        | Health check       | 200                    |

### Example payloads

```json
// POST /tasks
{ "title": "Buy milk", "completed": false }

// PUT /tasks/1
{ "title": "Buy oat milk", "completed": true }
```

All responses are JSON.

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Docker](https://www.docker.com/) & Docker Compose
- (Optional) A local PostgreSQL instance if running outside Docker

### 1. Clone & install

```bash
npm install
```

### 2. Environment

Copy the example file and adjust if needed:

```bash
cp .env.example .env
```

> `.env` is git-ignored.  When running inside Docker Compose the variables are
> set by `docker-compose.yml`.

### 3. Run locally (requires a local Postgres)

```bash
# Make sure your local Postgres has a `tasksdb` database matching .env
npm run dev
```

### 4. Run with Docker (recommended)

```bash
docker compose up --build
```

- App → `http://localhost:3000`
- Postgres → `localhost:5432`

---

## Verifying data persistence

1. Start the stack:

   ```bash
   docker compose up --build
   ```

2. Create a few tasks:

   ```bash
   curl -s -X POST http://localhost:3000/tasks \
     -H 'Content-Type: application/json' \
     -d '{"title":"First task"}' | jq .

   curl -s -X POST http://localhost:3000/tasks \
     -H 'Content-Type: application/json' \
     -d '{"title":"Second task"}' | jq .
   ```

3. Stop everything:

   ```bash
   docker compose down
   ```

4. Start again:

   ```bash
   docker compose up --build
   ```

5. Verify tasks still exist:

   ```bash
   curl http://localhost:3000/tasks | jq .
   ```

Persistence works because **Postgres stores data in a named Docker volume**
(`pgdata`).  The volume survives container restarts and even `docker compose down`.
Only `docker compose down -v` (or `docker volume rm`) would delete the data.

---

## Project tree

```
postgres-docker-api/
├── .env.example
├── .gitignore
├── Dockerfile
├── README.md
├── docker-compose.yml
├── package.json
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   └── index.js
│   ├── controllers/
│   │   └── task.controller.js
│   ├── db/
│   │   ├── db.js
│   │   └── init.sql
│   ├── repositories/
│   │   ├── repository.interface.js
│   │   └── postgres.repository.js
│   ├── routes/
│   │   └── task.routes.js
│   └── services/
│       └── task.service.js
└── ...
```

---

## Satisfied requirements

| Requirement | Status |
|-------------|--------|
| Layered architecture (routes → controllers → services → repository) | ✅ |
| Service and routes never access PostgreSQL directly | ✅ |
| Repository interface + single implementation (`postgres.repository.js`) | ✅ |
| All CRUD endpoints (GET, POST, PUT, DELETE) | ✅ |
| Proper HTTP status codes | ✅ |
| JSON request/response | ✅ |
| PostgreSQL with SERIAL PK, BOOLEAN, TIMESTAMP DEFAULT NOW() | ✅ |
| `init.sql` auto-runs via Docker entry-point | ✅ |
| Dockerfile + docker-compose.yml | ✅ |
| Named Docker volume for Postgres | ✅ |
| App waits until DB is ready (retry loop + healthcheck) | ✅ |
| App on 3000, Postgres on 5432 | ✅ |
| `dotenv`, `.env.example`, `.gitignore` | ✅ |
| No ORM / Sequelize / Prisma / TypeScript | ✅ |
| `async/await`, error handling, meaningful JSON errors | ✅ |
| Professional README | ✅ |
| Data persists after restart | ✅ |
