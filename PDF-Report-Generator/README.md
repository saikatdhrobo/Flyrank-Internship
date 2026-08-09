# E-Commerce PDF Report Generator

An automated background-job-driven PDF analytics compiler with a premium web dashboard, built with Node.js, Express, SQLite, PDFKit, and node-cron.

This application queries e-commerce sales transactions from SQLite, aggregates key performance indicators using optimized SQL statements, and compiles them into a professionally formatted multi-page PDF report. 

---

## 🌟 Key Features

### 1. Zero-Setup Relational Database (SQLite)
- Built on `better-sqlite3` for high-throughput transactional read/write support.
- Fully automated schema migration (`src/db/schema.sql`) and dynamic seeding script (`src/db/seed.js`).

### 2. High-Performance SQL Aggregations
- Computes store performance markers dynamically:
  - **KPI Aggregates**: Revenue, order count, unique customers, item units sold.
  - **Sales by Category**: Revenue totals, item throughput, and category percentage share.
  - **Top Product Trends**: Ranks the top 5 revenue-producing inventory units.
  - **Audit Feeds**: Traces high-value premium purchases.

### 3. SQLite-Backed Background Job Queue (A7 Polling Pattern)
- Decouples API handlers from heavy rendering tasks:
  1. API request returns `202 Accepted` immediately with a `jobId`.
  2. Background worker polling loop detects `pending` jobs.
  3. Transitions status through `processing` with live percentage increments.
  4. Generates PDF file, writes to local disk, and saves the download URI.
  5. UI client polls `/api/jobs/:id` for real-time progress bar updates.

### 4. Cron Task Scheduling
- Dynamically registers standard cron expressions on startup via `node-cron`.
- Automates recurring report outputs (e.g. daily, weekly, or hourly sales pulse).
- Tracks schedule history, logging execution traces in the database schedules table.

### 5. Premium Dashboard UI
- **Glassmorphic Theme**: Deep space visual theme with blur backdrops and neon highlights.
- **KPI Indicators**: Auto-refreshing core metric summary cards.
- **Progress Tracker**: Interactive linear progress bar that pulses during runs.
- **Live Logs Console**: Terminal emulator displaying real-time background worker trace logs.

---

## 🛠️ Architecture

```
PDF-Report-Generator/
├── src/
│   ├── db/
│   │   ├── database.js     # SQLite connection & WAL activation
│   │   ├── schema.sql      # Tables schema structure
│   │   └── seed.js         # Seeding script for sales metrics
│   ├── services/
│   │   ├── pdf.service.js  # Aggregation queries & PDFKit builder
│   │   ├── worker.service.js # Background polling thread loop
│   │   └── scheduler.service.js # node-cron scheduled triggers manager
│   ├── controllers/
│   │   ├── report.controller.js # REST routes for jobs & worker logs
│   │   └── stats.controller.js  # Live KPI aggregates query supplier
│   ├── public/
│   │   ├── index.html      # Responsive glass-dashboard DOM structure
│   │   ├── index.css       # Visual styling, layouts, glow layers
│   │   └── index.js        # Frontend client API integration & polling loop
│   └── server.js           # Server initializer & background bootstrap
├── exports/                # Generated PDFs storage (gitignored)
├── data.db                 # SQLite database file (gitignored)
├── package.json            # Node project configuration
└── README.md               # User manual and system overview
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on modern Node.js v24)
- **NPM**

### 2. Install Dependencies
Run from the project root:
```bash
npm install
```

### 3. Seed Database
Generate 180+ mock sales orders to compute report charts:
```bash
npm run seed
```

### 4. Run Application
Start the server in watch mode:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## 📡 API Reference

### Reports & Background Jobs
- **POST `/api/reports`**: Enqueue manual report generation.
  - *Response (`202 Accepted`)*: `{"success": true, "jobId": "uuid-string", "status": "pending"}`
- **GET `/api/jobs/:id`**: Check state of active background generation.
  - *Response (`200 OK`)*: `{"jobId": "...", "status": "processing", "progress": 40, "result_url": null}`
- **GET `/api/reports`**: Return completed PDF list history.

### Schedules & Logs
- **GET `/api/schedules`**: Retrieve database-scheduled cron definitions.
- **POST `/api/schedules/trigger/:id`**: Manually force compile execution of scheduled cron tasks.
- **GET `/api/worker/logs`**: Fetch real-time background execution trace lines.
