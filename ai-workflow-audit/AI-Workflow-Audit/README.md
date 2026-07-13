# FL-01 – AI Workflow Audit and Tool Setup

**Student:** Backend AI Engineering Student  
**Course:** AI Fluency: Framework & Foundations  
**Date:** July 13, 2026

---

## 1. Workflow Audit

The table below captures 12 recurring tasks from a typical week as a Backend AI Engineering student. Each task is classified according to how much AI involvement is appropriate — from fully manual to fully automated.

| # | Task | Frequency | Classification | Rationale |
|---|------|-----------|----------------|-----------|
| 1 | **Studying transformer architecture papers** (e.g., "Attention Is All You Need") | 2× per week | **Just Me** | Understanding foundational research requires deep, personal comprehension that cannot be delegated or shortcut. |
| 2 | **Debugging a failing API integration test** (500 error in FastAPI route) | 3–4× per week | **Collaborate with AI** | AI helps parse stack traces and suggest root causes, but I own the debugging flow and verify every fix against my system's context. |
| 3 | **Writing PostgreSQL schema migrations** (Alembic revision files) | 1–2× per week | **Delegate to AI (with review)** | AI generates boilerplate migration code from my column spec; I review for data integrity, index decisions, and rollback safety. |
| 4 | **Practicing algorithmic problem-solving** (LeetCode/HackerRank) | 3× per week | **Just Me** | Building independent problem-solving muscle requires working through the struggle without AI assist — interviews won't have a copilot. |
| 5 | **Writing unit tests for FastAPI route handlers** | 2–3× per week | **Delegate to AI (with review)** | AI drafts parameterized tests from the route contract and type hints; I review coverage completeness and edge-case handling. |
| 6 | **Refactoring business logic from controllers into a service layer** | 1× per week | **Collaborate with AI** | AI suggests refactoring strategies and extracts logic candidates; I make the architectural decisions about boundaries and dependencies. |
| 7 | **Learning Docker Compose for multi-container setups** | 1× per week | **Delegate to AI (with review)** | AI generates `docker-compose.yml` drafts from my service descriptions; I verify networking, volume mounts, and service dependencies. |
| 8 | **Reviewing a peer's pull request** (study-group project) | 2× per week | **Just Me** | Code review builds critical judgment about readability, correctness, and style — a skill that must be exercised independently. |
| 9 | **Generating OpenAPI / Swagger documentation** | 1× per week | **Fully Automate** | FastAPI auto-generates interactive docs from decorators, Pydantic schemas, and route type hints — no manual writing needed. |
| 10 | **Formatting and linting Python codebase** | Daily | **Fully Automate** | Pre-commit hooks running `black`, `isort`, and `ruff` handle this with zero human intervention on every `git commit`. |
| 11 | **Drafting a cold-email to a startup for internship opportunities** | 2× per month | **Delegate to AI (with review)** | AI generates a professional draft from my background bullet points; I personalise the tone, add specific project references, and proofread before sending. |
| 12 | **Writing a weekly progress summary for my mentor** | 1× per week | **Collaborate with AI** | AI helps structure scattered bullet points into coherent prose; I supply the actual accomplishments, blockers, and next steps — the substance cannot be fabricated. |

### Classification Summary

| Classification | Count |
|----------------|-------|
| Just Me | **3** (tasks 1, 4, 8) |
| Delegate to AI (with review) | **4** (tasks 3, 5, 7, 11) |
| Collaborate with AI | **3** (tasks 2, 6, 12) |
| Fully Automate | **2** (tasks 9, 10) |

---

## 2. AI Tool Setup

The following accounts have been created and are active:

| Tool | Account Status | Notes |
|------|----------------|-------|
| **ChatGPT** | ✅ Active (free tier) | Used for quick drafts, brainstorming, and conversational Q&A. |
| **Claude** | ✅ Active (free tier) | Used for structured project work, code generation, and deeper technical reasoning. Claude's long context window is especially useful for reviewing entire files at once. |
| **Anthropic Academy** | ✅ Enrolled | Enrolled in **"AI Fluency: Framework & Foundations"**. The first module (Introduction to AI Fluency) has been completed, covering the core framework for classifying tasks along the AI-involvement spectrum. |

---

## 3. Claude Project Configuration

A dedicated Claude Project has been configured for this course.

> **Project Name:** `Backend-AI-Engineering-FL`

Custom instructions are stored in [`claude-project-notes.md`](./claude-project-notes.md) and include:
- My identity as a Backend AI Engineering student
- Preferred tone (direct, clear, encouraging)
- Current learning goals (Python/FastAPI, PostgreSQL, containerisation, testing)
- Response style preferences (concise with examples, code-first)
- Coding preferences (type hints, PEP 8, docstrings, test coverage)
- How Claude should assist (draft → review → refine workflow)

---

## 4. Three Target Tasks for FL-02 to FL-04

These tasks build on the workflow audit and will be executed in the next three assignments.

### FL-02: Build a REST API Endpoint with PostgreSQL Integration

| Aspect | Detail |
|--------|--------|
| **Task** | Implement a CRUD endpoint for a `projects` resource in FastAPI, connected to a PostgreSQL database via SQLAlchemy and Alembic migrations. |
| **Why it matters** | The read–write–migrate cycle is the fundamental backend operation. Mastering this flow without copy-paste scaffolding is essential for every production API. |
| **Definition of "Done Well"** | ✅ Working CRUD (Create, Read, Update, Delete) operations<br>✅ Correct HTTP status codes (201, 200, 204, 404, 422)<br>✅ Pydantic input validation with custom error messages<br>✅ Alembic migration that applies cleanly and rolls back<br>✅ No SQL injection vectors (parameterised queries throughout)<br>✅ < 15 minutes of manual edits after AI-assisted scaffolding |

### FL-03: Write Automated Tests for an API Endpoint

| Aspect | Detail |
|--------|--------|
| **Task** | Write a comprehensive test suite for the FL-02 endpoint using `pytest` with `TestClient` and a test database fixture. |
| **Why it matters** | Automated testing separates toy projects from production-quality code. Building this habit early prevents regressions and documents expected behaviour. |
| **Definition of "Done Well"** | ✅ Happy-path test for each CRUD operation<br>✅ At least two error-case tests (e.g., not-found, validation failure)<br>✅ Test database uses an isolated SQLite in-memory or dedicated test-PostgreSQL<br>✅ Tests use fixtures (`pytest.fixture`) for session and client<br>✅ All tests pass with `pytest -v` showing clear test names<br>✅ Code coverage ≥ 80% for the tested router module |

### FL-04: Create a Dockerized Backend Deployment Setup

| Aspect | Detail |
|--------|--------|
| **Task** | Containerise the FastAPI application and PostgreSQL database using Docker Compose, with persistent volumes and environment-based configuration. |
| **Why it matters** | Containerisation is the industry standard for reproducible, portable deployments. Understanding `Dockerfile` + `docker-compose.yml` is a baseline expectation for backend roles. |
| **Definition of "Done Well"** | ✅ `Dockerfile` builds without warnings or errors<br>✅ `docker-compose up` starts both API and database containers<br>✅ Database data persists across `docker-compose down` / `up` cycles<br>✅ Configuration uses environment variables (no hard-coded secrets)<br>✅ Health-check endpoint (`GET /health`) returns 200 before tests run<br>✅ README contains a single `docker-compose up` instruction to run the project |

---


