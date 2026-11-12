# Study Planner

A mobile app that turns a Subject, an Exam Date and the hours a Student can study each week into a day-by-day Study Plan they can tick off.

- `backend/`: Express API (TypeScript), the shared request/response contract, and the database schema.
- `app/`: the Expo mobile app (coming in phase 2).

Domain vocabulary is in [`GLOSSARY.md`](GLOSSARY.md), architectural decisions in [`docs/adr/`](docs/adr/), and the full spec in [`.scratch/study-planner/spec.md`](.scratch/study-planner/spec.md).

## Prerequisites

- Node 22: run `nvm use` in the repo root (see `.nvmrc`).
- A free [Supabase](https://supabase.com) project.

## Setup

1. **Install dependencies** in the repo root:

   ```sh
   nvm use
   npm install
   ```

2. **Create the database.** In your Supabase project open the **SQL Editor**, paste the whole of [`backend/db/schema.sql`](backend/db/schema.sql) and press **Run**. It creates every table, index and constraint. Running it again does no harm.

3. **Configure the backend.**

   ```sh
   cp backend/.env.example backend/.env
   ```

   Fill in `DATABASE_URL` (Supabase → **Connect** → Connection string → **Session pooler**) and `JWT_SECRET`. Optionally set `DATABASE_CA_CERT` to Supabase's downloaded CA certificate so the connection's certificate is verified. The comments in `.env.example` explain each value.

4. **Start the API.**

   ```sh
   npm run dev
   ```

   On startup it checks the database connection and prints the address to use from a phone on the same Wi-Fi, for example `http://192.168.1.23:3000`. Open `<that address>/health` in the phone's browser: it should show `{"ok":true}`. If it doesn't, the phone can't reach the laptop. Check that both are on the same network and that the firewall allows incoming connections for Node.

## Tests

```sh
npm test         # every test suite; needs no database (runs on in-memory PGlite)
npm run typecheck
```

The API tests drive the HTTP endpoints end to end against PGlite loaded with the same `schema.sql` you paste into Supabase.

## API

All endpoints except `/health` and `/auth/*` need an `Authorization: Bearer <token>` header.

| Endpoint | Purpose |
| --- | --- |
| `GET /health` | Reachability check |
| `POST /auth/register` | Create an account and sign in |
| `POST /auth/login` | Sign in |
| `POST /plans/proposal` | Compute a Proposal without saving it |
| `POST /plans` | Save a Study Plan |
| `GET /plans` | My Plans, nearest Exam Date first |
| `GET /plans/:planId` | One Study Plan with its Activities |
| `PATCH /plans/:planId/activities/:activityId` | Mark an Activity completed or not |
| `DELETE /plans/:planId` | Delete a Study Plan and its Activities |

Request and response shapes are defined once, as Zod schemas, in `backend/src/contract`.
