# Study Planner

A mobile app that turns a Subject, an Exam Date and the hours a Student can study each week into a day-by-day Study Plan they can tick off.

- `backend/`: Express API (TypeScript), the shared request/response contract, and the database schema.
- `app/`: the Expo mobile app (Expo SDK 58, Expo Router), built from the approved Claude Design mock-ups.

Domain vocabulary is in [`GLOSSARY.md`](GLOSSARY.md), architectural decisions in [`docs/adr/`](docs/adr/), and the full spec in [`.scratch/study-planner/spec.md`](.scratch/study-planner/spec.md).

## Prerequisites

- Node 22.13 or newer: `nvm install 22` once, then `nvm use` in the repo root (see `.nvmrc`). Expo SDK 58 refuses older Node 22 releases.
- A free [Supabase](https://supabase.com) project.
- An iPhone with [Expo Go](https://apps.apple.com/app/expo-go/id982107779) from the App Store, on the same Wi-Fi as the laptop.

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
   npm run dev:api
   ```

   On startup it checks the database connection and prints the address to use from a phone on the same Wi-Fi, for example `http://192.168.1.23:3000`. Open `<that address>/health` in the phone's browser: it should show `{"ok":true}`. If it doesn't, the phone can't reach the laptop. Check that both are on the same network and that the firewall allows incoming connections for Node.

5. **Point the app at the API.**

   ```sh
   cp app/.env.example app/.env
   ```

   Set `EXPO_PUBLIC_API_URL` to the address from step 4 (no trailing slash).

6. **Start the app** in a second terminal and scan the QR code with the iPhone's Camera app; it opens in Expo Go:

   ```sh
   npm run dev:app
   ```

   `npm run dev` starts the API and the app together in one terminal instead. After changing `app/.env`, restart the app with `npm run dev:app -- --clear`.

## Tests

```sh
npm test           # every test suite; needs no database and no phone
npm run typecheck
npm run lint -w app
```

- **API** (Vitest + supertest): drives the HTTP endpoints end to end against PGlite loaded with the same `schema.sql` you paste into Supabase.
- **App** (Jest + React Native Testing Library): renders the real screens through Expo Router with the phone's clock fixed at Wednesday 18.11.2026. The network is a fake server at `fetch`, whose replies are checked against the same contract schemas the API uses.

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
