# 🔐 Auth — Login & Protect

A secure Express API that handles user authentication (**Sign Up**, **Log In**, **Log Out**) and protects specific routes with bearer tokens. User accounts and JSON Web Tokens (JWTs) are managed by **[Supabase Auth](https://supabase.com/docs/guides/auth)** as the Identity Provider — the API never touches passwords directly. The whole flow is documented and testable in **Swagger UI** at `/docs`.

Built as assignment **BE-03** (Week 4) of the FlyRank Backend AI Engineering internship.

## How it works — the trust triangle

```
┌────────┐  credentials (email+password)   ┌──────────────┐
│ Client │ ──────────────────────────────▶ │   Supabase   │  Identity Provider
│        │ ◀────────────────────────────── │   (IdP)      │  validates + issues JWT
└────────┘         access_token (JWT)      └──────────────┘
    │                                            ▲
    │   Authorization: Bearer <token>            │ verifies the token
    ▼                                            │
┌────────┐        user data / 401               │
│ Server │ ─────────────────────────────────────┘
└────────┘
```

1. The client sends `email` + `password` to Supabase (via `/auth/signup` or `/auth/login`).
2. Supabase validates the credentials and returns a **JWT (access token)**.
3. The client sends requests to the API with the JWT in the `Authorization: Bearer <token>` header.
4. The API verifies the JWT with Supabase (`supabase.auth.getUser(token)`) and only then opens the protected door.

## Tech stack

| Piece        | Choice                                    |
| ------------ | ----------------------------------------- |
| Runtime      | Node.js + Express 5                       |
| Identity     | `@supabase/supabase-js` (Supabase Auth)   |
| Docs         | `swagger-ui-express` + OpenAPI 3.0        |
| Secrets      | `dotenv` (`.env`, gitignored)             |

## Getting started (run in under 5 minutes)

### 1. Create a Supabase project

1. Create a free account at [supabase.com](https://supabase.com) and start a new project (e.g. `Auth-Practice`).
2. Open **Project Settings → API**.
3. Copy your **Project URL** and your **anon / public key**.

### 2. Set up environment variables

```bash
cp .env.example .env
```

Then edit `.env` with your real values:

```dotenv
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_KEY=your-anon-key
PORT=3000
```

> ⚠️ `.env` is listed in `.gitignore` and must **never** be committed — it contains your Supabase secrets.

### 3. Install and run

```bash
npm install
npm start
```

You should see:

```
Server running and connected to Supabase on http://localhost:3000
```

That's it — the API is live. A peer can clone this repo, plug in their own `.env`, and be up in under 5 minutes.

## API reference

| Method | Endpoint                  | Auth required | Body / Header                          | Success      | Failures                                        |
| ------ | ------------------------- | ------------- | -------------------------------------- | ------------ | ----------------------------------------------- |
| POST   | `/auth/signup`            | ❌ No         | `{ "email", "password" }`              | `201`        | `400` missing/invalid input                      |
| POST   | `/auth/login`             | ❌ No         | `{ "email", "password" }`              | `200` + JWT  | `400` missing input · `401` bad credentials      |
| POST   | `/auth/logout`            | ✅ Yes        | `Authorization: Bearer <token>`        | `204`        | `401` missing/invalid/expired token              |
| GET    | `/public/info`            | ❌ No         | —                                      | `200`        | —                                               |
| GET    | `/protected/profile`      | ✅ Yes        | `Authorization: Bearer <token>`        | `200`        | `401` missing/invalid/expired token              |
| GET    | `/protected/dashboard`    | ✅ Yes        | `Authorization: Bearer <token>`        | `200`        | `401` missing/invalid/expired token              |
| GET    | `/docs`                   | ❌ No         | —                                      | `200`        | —                                               |

### Example: sign up, log in, and hit a protected route

```bash
# 1. Create an account
curl -i -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 2. Log in and copy the access_token from the response
curl -i -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 3. Call a protected route with the token
curl -i http://localhost:3000/protected/profile \
  -H "Authorization: Bearer <PASTE_YOUR_ACCESS_TOKEN_HERE>"
```

Tampering with even one character of the token makes Supabase reject it — the API answers `401 Invalid or expired token`.

## Swagger UI

Interactive, self-documenting UI at **http://localhost:3000/docs**.

Every route is listed with its request body and response codes, and the protected routes show a **padlock**. To try them:

1. Log in via `POST /auth/login` using **Try it out**.
2. Copy the `access_token` from the response.
3. Click **Authorize** (top right), paste the token, and confirm.
4. **Try it out** on `GET /protected/profile` or `GET /protected/dashboard` — you get the user's data; un-authorized calls get `401`.

> Screenshot: capture your own `/docs` page after running the server (not included in this repo).

## Project structure

```
.
├── .env.example          # Documented template — copy to .env and fill in
├── .gitignore            # Keeps node_modules/ and .env out of git
├── package.json
├── README.md
└── src
    ├── server.js         # Entry point — boots the server
    ├── app.js            # Express app: routes + Swagger UI wiring
    ├── openapi.json      # OpenAPI 3.0 spec (drives /docs)
    ├── config
    │   └── index.js      # Env vars + Supabase client
    ├── middleware
    │   └── auth.middleware.js  # requireAuth: reusable bearer-token guard
    └── routes
        ├── auth.routes.js      # /auth/signup, /auth/login, /auth/logout
        ├── public.routes.js    # /public/info
        └── protected.routes.js # /protected/profile, /protected/dashboard
```

## How the security works

- **Identity Provider (IdP):** Supabase Auth stores accounts and verifies credentials — we never write password hashing or JWT signing code ourselves.
- **Token verification:** `requireAuth` middleware extracts the token from the `Authorization` header (checking the `Bearer ` prefix), then calls `supabase.auth.getUser(token)` to have Supabase validate it — expired, tampered, or malformed JWTs are rejected with `401`.
- **Status codes:** `201` on signup · `200` on successful login/read · `204` on logout · `400` on missing input · `401` on missing/incorrect/expired tokens · `500` only when Supabase itself is unreachable (so a network blip is never misreported as a credential problem).

## Requirements checklist

- [x] Server starts on `localhost` with a single documented terminal command (`npm start`).
- [x] `.env` is used properly and `.gitignore` keeps it (and `node_modules/`) out of git.
- [x] `POST /auth/signup` and `POST /auth/login` talk to Supabase Auth.
- [x] `GET /protected/profile` extracts and verifies the bearer token from the `Authorization` header.
- [x] Correct status codes: `201` signup, `200` login/read, `204` logout, `400` missing inputs, `401` bad/missing/expired tokens.
- [x] Auth check extracted into reusable middleware (`requireAuth`).
- [x] Swagger UI at `/docs` with Bearer Token authorization fully functional.
- [x] Public GitHub repo with 7 clean commits and this README.

## License

[MIT](../../LICENSE)
