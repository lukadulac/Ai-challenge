# Spec: Study Planner

Status: ready-for-agent

## Problem Statement

A Student preparing for an exam knows the Subject, the Exam Date and roughly how many hours a week they can study, but turning that into a concrete day-by-day plan is tedious and easy to get wrong: they either cram at the end or spread effort unevenly, and they have no simple way to see how much of their preparation is actually done. They want to type in those three facts, get a sensible Study Plan back, and tick off Activities as they go.

The challenge brief requires an app where the Student can:

1. enter the Subject they are preparing and the Exam Date,
2. enter how many hours per week they have available for studying,
3. get a suggested study plan,
4. mark an Activity as completed.

## Solution

A mobile app (Expo, runs in Expo Go) backed by an Express API and a Supabase Postgres database.

The Student registers with email and password and stays signed in. On the New Plan screen they enter a Subject, pick an Exam Date and set their Weekly Hours, then tap "Prikaži predlog" to see a Proposal: a list of Activities, one per study day, each with a date, a duration and an Activity Type (Learning, Review or Mock Exam). They can tweak the inputs and look again; when happy, they tap "Sačuvaj plan" and the Proposal becomes a Study Plan.

My Plans lists all their Study Plans, nearest exam first, each showing days left until the exam and Progress. A Study Plan shows its Activities in date order, highlights today's Activity, marks Missed Activities, and lets the Student tap any Activity to mark it completed (or tap again to unmark it). Progress updates immediately. A Study Plan can be deleted after confirmation.

On top of the four required features, the Student also gets four extras: deleting a Study Plan, days-left and Progress on every plan in the list, highlighting of today's and Missed Activities, and ordering the list by Exam Date.

## User Stories

### Account

1. As a Student, I want to register with my email and a password, so that my Study Plans are kept in my own account.
2. As a Student, I want to be signed in right after registering, so that I can start planning without an extra step.
3. As a Student, I want to sign in with my email and password, so that I can get back to my Study Plans on this phone.
4. As a Student, I want my email treated the same regardless of capitalisation, so that "Luka@x.com" and "luka@x.com" reach the same account.
5. As a Student, I want to be told when an email is already registered, so that I sign in instead of trying to create a duplicate.
6. As a Student, I want one "Pogrešan email ili lozinka" message whenever sign-in fails, so that nobody can probe which emails have accounts.
7. As a Student, I want my password to require at least 8 characters, so that my account isn't trivially guessable.
8. As a Student, I want to reveal the password I'm typing, so that I can catch typos without a confirm-password field.
9. As a Student, I want to stay signed in between app launches for up to 30 days, so that I don't have to sign in every time.
10. As a Student, I want to sign out, so that someone else using my phone can't see my plans.
11. As a Student, I want to be returned to the Login screen when my session is no longer valid, so that I'm never stuck on a broken screen.
12. As a Student, I want to see only my own Study Plans, so that my data stays private.

### Getting a Proposal

13. As a Student, I want to enter the Subject name, so that I know which exam a Study Plan is for.
14. As a Student, I want to pick the Exam Date from a calendar, so that I can't enter an invalid date.
15. As a Student, I want to enter my Weekly Hours, so that the plan fits the time I really have.
16. As a Student, I want to see a Proposal before anything is saved, so that I can judge whether it suits me.
17. As a Student, I want to change the Exam Date or Weekly Hours and ask for a new Proposal, so that I can compare options.
18. As a Student, I want the shown Proposal to disappear as soon as I change an input, so that I never save a plan I haven't seen.
19. As a Student, I want each Activity in the Proposal to show its date, duration and Activity Type, so that I know what each study day involves.
20. As a Student, I want the total planned hours shown with the Proposal, so that I see the overall effort.
21. As a Student, I want my study days spread evenly through each week, so that I don't get several long days in a row followed by long gaps.
22. As a Student, I want study days of roughly two hours, so that each day is a manageable chunk.
23. As a Student, I want the last Activity to fall on the day before the exam, so that the material is fresh.
24. As a Student, I want the plan to go from Learning to Review to Mock Exam, so that I learn, consolidate, then practise.
25. As a Student whose exam is tomorrow, I want a single Review Activity today, so that I still get a useful plan.
26. As a Student, I want to be stopped from choosing an Exam Date of today or earlier, so that every Proposal has at least one study day.
27. As a Student, I want to be stopped from choosing an Exam Date more than a year away, so that plans stay realistic.
28. As a Student, I want Weekly Hours limited to whole numbers from 1 to 40, so that the plan is realistic.
29. As a Student, I want the Subject to be required and at most 100 characters, so that every plan has a readable name.
30. As a Student, I want validation errors shown in Serbian next to the field, so that I know exactly what to fix.

### Saving a Study Plan

31. As a Student, I want to save a Proposal as a Study Plan, so that I can follow it over the coming days.
32. As a Student, I want the saved Study Plan to match the Proposal I saw exactly, so that there are no surprises.
33. As a Student, I want to land on the new Study Plan right after saving, so that I can start following it.
34. As a Student, I want "today" to mean today on my phone, so that a plan made near midnight starts on the right day.
35. As a Student, I want to have several Study Plans at once, so that I can prepare for several exams.
36. As a Student, I want to create two Study Plans with the same Subject, so that I can plan a midterm and a final, or a retake, separately.

### My Plans

37. As a Student, I want my Study Plans ordered by Exam Date with the nearest first, so that I focus on what's most urgent.
38. As a Student, I want each Study Plan to show how many days remain until the exam, so that I can see how much time I have left.
39. As a Student, I want each Study Plan to show its Progress as a percentage, so that I see at a glance how far along I am.
40. As a Student, I want Study Plans whose exam has passed to be labelled as such and listed after the upcoming ones, so that they don't crowd the top of the list.
41. As a Student with no Study Plans, I want a clear empty state with a button to create one, so that I know where to start.

### Following a Study Plan

42. As a Student, I want to see the Subject, Exam Date and Progress at the top of a Study Plan, so that I have context while I study.
43. As a Student, I want Progress shown both in Activities and in hours (for example "4/12 · 7 od 20 h"), so that I see effort as well as count.
44. As a Student, I want Activities listed in date order, so that I can follow the plan day by day.
45. As a Student, I want today's Activity highlighted, so that I know what to do today.
46. As a Student, I want Missed Activities clearly marked, so that I see where I've fallen behind.
47. As a Student, I want to mark an Activity as completed by tapping it, so that I can track my progress.
48. As a Student, I want to tap a completed Activity to unmark it, so that I can undo a mistaken tap.
49. As a Student, I want to mark a future Activity as completed, so that studying ahead counts.
50. As a Student, I want the Activity's state to change the moment I tap it, so that the app feels responsive.
51. As a Student, I want a failed change to be reverted with a short message, so that what I see always matches what's saved.
52. As a Student, I want Progress to update as soon as I complete or unmark an Activity, so that I get immediate feedback.
53. As a Student, I want Missed Activities to stay where they are, without the plan being rearranged, so that the plan stays predictable.

### Deleting a Study Plan

54. As a Student, I want to delete a Study Plan, so that I can remove plans I no longer need.
55. As a Student, I want to confirm before a Study Plan is deleted, so that I don't lose it by accident.
56. As a Student, I want a deleted Study Plan's Activities to be removed with it, so that nothing is left behind.

### General

57. As a Student, I want the app in Serbian (Latin script) with dates written as 14.11.2026., so that it reads naturally.
58. As a Student, I want a clear message when the server can't be reached, so that I know it's a connection problem and not my mistake.

### Developer

59. As the developer, I want the whole database defined in one SQL file that I paste into Supabase, so that database setup is a single step.
60. As the developer, I want the API tests to run against that same SQL file, so that I know it works before I paste it.
61. As the developer, I want one install and one command that start both the backend and the app, so that running the project is easy.
62. As the developer, I want a README with step-by-step local setup, so that I or a reviewer can run the project.
63. As the developer, I want example env files committed, so that I know exactly which settings to fill in.
64. As the developer, I want the backend to refuse to start with missing or invalid settings, so that misconfiguration is obvious immediately.

## Implementation Decisions

### Repository and tooling

- One repo with an npm-workspaces root and two workspaces: `app` (Expo + Expo Router) and `backend` (Express). TypeScript everywhere, Node 22.
- The root offers one install, one command that runs the backend and the Expo dev server together, one command that runs every test suite, and one typecheck command.
- Expo uses the latest stable SDK at implementation time, because the store version of Expo Go only runs the latest SDK. Routes live in Expo Router's `src/app` directory, so the workspace isn't `app/app`.
- Backend: Express 5 (async handlers' errors reach the error middleware without wrappers), run with a TypeScript runner in dev. Passwords are hashed with a pure-JS bcrypt implementation, so there is no native build step.

### Contract

- Every request and response body is described once with Zod schemas in a contract module in the `backend` workspace. The module is exposed to the app through its own package entry point that imports nothing but Zod, so Metro never bundles Express or the database driver.
- The backend validates every request with these schemas. The app validates forms with the same schemas before calling the API and parses every response with them.
- Validation messages are written in Serbian inside the schemas, so the app shows the same text whether it caught a mistake itself or the API did.
- JSON uses camelCase. Calendar dates (Exam Date, Activity date, "today") always travel as plain `YYYY-MM-DD` strings, never as timestamps.

### Architecture

- Express is the only client of Supabase (ADR-0001). The app holds no database credentials.
- The Express app is built by a factory that takes its dependencies, a database handle and config such as the JWT secret, so tests can pass in PGlite. A separate entry point reads the environment, connects to Supabase and listens.
- The database handle is a minimal interface: run a parameterised SQL query and get rows back. A `pg` pool satisfies it in production and PGlite satisfies it in tests. There is no ORM; all queries are plain parameterised SQL.
- Queries return `date` columns as text, so neither driver converts them into JS `Date` objects in the machine's local time zone. All date arithmetic in TypeScript works on calendar dates in UTC, never local time.
- Config is read from the environment and validated with Zod at startup. The backend exits with a clear message if anything is missing or invalid. Settings: `DATABASE_URL` (the Supabase "Session pooler" connection string, which works over IPv4 and suits a long-running server; SSL is required), optionally `DATABASE_CA_CERT` (path to Supabase's downloadable CA certificate; when set the server's identity is verified, otherwise the connection is encrypted but unverified and the backend warns at startup), `JWT_SECRET`, and `PORT` (default 3000). The server listens on all interfaces so a phone on the same Wi-Fi can reach it.
- Backend modules:
  - **Planner**: a pure function from (today, Exam Date, Weekly Hours) to an ordered list of Activities. It has no I/O.
  - **Auth**: registration, sign-in, password hashing, token issuing, and the middleware that resolves the current Student from the bearer token.
  - **Study Plans**: routes plus the repository that reads and writes Study Plans and Activities, always scoped to the current Student.
  - **Contract**: the shared Zod schemas.
  - **Errors**: one error middleware that maps validation, auth and not-found errors to the error shape below and hides internal errors.

### Database schema (single hand-applied SQL file, ADR-0002)

- **students**: id (uuid, generated), email (text, required, unique case-insensitively through a unique index on its lower-cased value), password hash (text, required), created at (timestamptz).
- **study_plans**: id (uuid, generated), student id (required, references students, cascade on delete), subject (text, required, 1–100 characters after trimming, enforced by a check), exam date (date, required), weekly hours (integer, required, check 1–40), created at (timestamptz). Index on (student id, exam date) for the ordered list.
- **activities**: id (uuid, generated), study plan id (required, references study_plans, cascade on delete), date (date, required), duration in minutes (integer, check: positive and a multiple of 30), type (text, check: `learning`, `review` or `mock_exam`), completed (boolean, default false). Unique on (study plan id, date), which enforces one Activity per day.
- The file runs on an empty database. It uses `if not exists` so that re-running it by accident does no harm. It uses only core Postgres features that PGlite also supports (for example `gen_random_uuid()`, no extensions). It contains no stored functions; plan generation lives in TypeScript.

### Authentication (ADR-0003)

- Register takes an email and a password. The email is trimmed, checked as an email address and stored lower-cased. The password must be at least 8 characters and at most 72 bytes (bcrypt's limit). The message tells the Student that č, ć, š, ž and đ count as two.
- Register returns a token and the Student (id, email), so the Student is signed in at once. A taken email, compared case-insensitively, returns `email_taken`.
- Sign-in returns the same shape. An unknown email and a wrong password produce the identical `invalid_credentials` response.
- Tokens are HS256 JWTs signed with `JWT_SECRET`. The subject is the Student id and they expire after 30 days. There are no refresh tokens. Sign-out is client-only: the app deletes its stored token.
- Every Study Plan endpoint requires `Authorization: Bearer <token>`. A missing, malformed or expired token returns 401 `unauthorized`.
- A Study Plan or Activity that belongs to another Student is treated as nonexistent (404), so its existence is not revealed.

### API contract

| Endpoint | Body | Success |
| --- | --- | --- |
| `GET /health` | – | 200, used to check the phone can reach the laptop |
| `POST /auth/register` | email, password | 201: token, student |
| `POST /auth/login` | email, password | 200: token, student |
| `POST /plans/proposal` | subject, examDate, weeklyHours, today | 200: the Proposal (Activities with date, durationMinutes, type, plus totalMinutes). Nothing is stored. |
| `POST /plans` | subject, examDate, weeklyHours, today | 201: the saved Study Plan in detail form |
| `GET /plans` | – | 200: summaries ordered by Exam Date ascending, then creation time |
| `GET /plans/:planId` | – | 200: the Study Plan in detail form |
| `PATCH /plans/:planId/activities/:activityId` | completed (boolean) | 200: the updated Activity and the Study Plan's new Progress |
| `DELETE /plans/:planId` | – | 204; its Activities go with it |

- Proposal and save take the same input and call the same Planner. Save recomputes the Activities on the server and never accepts them from the client. Because the Planner is deterministic, the saved Study Plan equals the Proposal the Student saw for the same inputs and the same "today".
- Input rules:
  - Subject is trimmed and must be 1–100 characters.
  - Weekly Hours is an integer from 1 to 40.
  - "today" is a valid calendar date taken from the phone. The server trusts it.
  - Exam Date is a valid calendar date, strictly after "today" and at most 365 days after it.
- Summary form: id, subject, examDate, weeklyHours, Progress.
- Detail form: id, subject, examDate, weeklyHours, createdAt, Progress, and the Activities in date order, each with id, date, durationMinutes, type and completed.
- Progress is completedActivities, totalActivities, completedMinutes and totalMinutes, always computed by the server.
- Marking an Activity is a set, not a toggle: the client sends the state it wants, so a repeated request is harmless.
- Error shape for every failure: an `error` object with a machine-readable `code`, a Serbian `message`, and for validation failures a `fields` map from field name to message. Codes: `validation_failed` (400), `invalid_credentials` (401), `unauthorized` (401), `not_found` (404), `email_taken` (409), `internal_error` (500, no details leaked).

### Planner rules

Inputs are today, the Exam Date and the Weekly Hours. Let the last study day be the day before the Exam Date. The study window runs from today to the last study day inclusive, and always has at least one day.

1. **One Activity per study day.** An Activity is a date, a duration and an Activity Type.
2. **Study days per week** = Weekly Hours ÷ 2, rounded up, capped at 7. For example, 1–2 h gives 1 day, 6 h gives 3 days, and 13 h or more gives every day.
3. **Placement works backwards from the last study day in 7-day blocks.** Block 0 is the last study day and the six days before it, block 1 is the seven days before that, and so on. With *d* study days per week, study day *i* (for *i* = 0 … *d*−1) of each block falls *floor(i × 7 / d)* days before that block's last day. So 3 days per week puts them 0, 2 and 4 days back, and 2 days per week puts them 0 and 3 days back. Days before today are dropped. As a result, the last Activity is always on the day before the exam.
4. **Durations.** Each block's Weekly Hours, counted in half-hours, are split evenly across its *d* study days. Any remainder goes, one half-hour each, to the chronologically earliest days of the block. For example, 5 h over 3 days gives 2 h, 1,5 h and 1,5 h. Every block uses the same pattern, so a partial first block (cut off by today) simply has fewer Activities. Durations are always a whole number of half-hours and never below 1 h.
5. **Activity Types by position**, in chronological order, where *n* is the number of Activities:
   - *n* = 1: Review.
   - *n* = 2: Learning, Review.
   - *n* ≥ 3: Mock Exam = max(1, round(0.1·*n*)) and Review = max(1, round(0.3·*n*)), with halves rounded up and computed in integer arithmetic. Learning is the rest. The order is all Learning, then Review, then Mock Exam.

Worked examples, which are also acceptance tests:

- Today 2026-11-12 (Thursday), Exam Date 2026-11-26, Weekly Hours 6 gives 3 days a week of 2 h each: Learning on 11-14, 11-16 and 11-18, Review on 11-21 and 11-23, Mock Exam on 11-25. That is 6 Activities and 12 h. Today itself is not a study day.
- Today 2026-11-12, Exam Date 2026-11-13, Weekly Hours 3 gives a single Activity today: 1,5 h of Review.
- With Weekly Hours 5, every full block has three study days of 2 h, 1,5 h and 1,5 h, in chronological order.

### Mobile app

- Screens: Login, Register, My Plans, New Plan and Study Plan. A signed-out route group (Login, Register) and a signed-in group (everything else) redirect based on whether a token is stored.
- The token is stored in `expo-secure-store`. The API base URL comes from an Expo public env var (`EXPO_PUBLIC_API_URL`), pointing at the laptop's LAN IP.
- One API client module wraps `fetch`, attaches the bearer token, parses responses with the contract schemas, turns error bodies into typed errors, and on any 401 from a Study Plan endpoint clears the token and sends the Student to Login. A network failure produces a "Server nije dostupan" message.
- Server state is handled with TanStack Query. Saving, deleting and marking Activities refresh the affected list and detail views. Marking an Activity is optimistic, and a failure rolls it back and shows a short message.
- New Plan holds the form: Subject, Exam Date (native date picker limited to tomorrow … today + 365 days) and Weekly Hours.
  - "Prikaži predlog" calls the Proposal endpoint and shows the Activities and total hours below the form.
  - Changing any input clears the shown Proposal.
  - "Sačuvaj plan" is only available while a Proposal is shown. It saves with the same inputs and opens the new Study Plan.
- My Plans lists summaries: upcoming exams in ascending date order first, then plans whose Exam Date has passed. Each shows the Subject, Exam Date, days left ("još X dana", "ispit je danas" or "ispit je prošao") and the Progress percentage. The screen also has a "Novi plan" button, sign-out, and an empty state.
- Study Plan shows the Subject, Exam Date and Progress as "completed/total · completed od total h" (fractional hours with a decimal comma), then the Activities in date order.
  - Today's Activity is highlighted.
  - A Missed Activity is one dated before today that is not completed.
  - Tapping any Activity sets the opposite completed state.
  - A delete action asks for confirmation, then returns to My Plans.
- "Today", days left and Missed are computed on the phone from its local date. The "today" sent to the API is the phone's local date.
- Copy is in Serbian (Latin script). Dates are shown as `dd.MM.yyyy.` and weeks start on Monday. Activity Types are labelled "Novo gradivo" (Learning), "Ponavljanje" (Review) and "Probni ispit" (Mock Exam).
- Visual design is produced with Claude Design at the start of phase 2 and reviewed by the developer before any screen is built. Colours, typography and style are decided then.

### Environment files

- The backend and app env files are git-ignored. Both have a committed `.env.example` with placeholders and a comment explaining where each value comes from: which Supabase connection string to copy, how to generate `JWT_SECRET`, and how to find the laptop's LAN IP.

## Testing Decisions

- A good test exercises only external behaviour through one of the two agreed seams and asserts what a client or the Student can observe: status codes, response bodies, rendered text, navigation. It never calls internal modules (Planner, repository, middleware) directly, never inspects SQL, and survives any refactor that keeps behaviour the same.
- Work proceeds test-first (red, green, refactor) at these seams, with typechecking and single test files run regularly and the full suite once at the end of each phase.

### Seam 1: HTTP API (phase 1, the main seam)

- Vitest + supertest against the app factory, with PGlite as the database loaded from the same SQL schema file pasted into Supabase. Each test file starts with a fresh database. A fixed test JWT secret is used.
- Coverage:
  - **Registration:** success; duplicate email in a different case; invalid email; password too short or too long.
  - **Sign-in:** success; wrong password and unknown email return identical responses.
  - **Auth required:** no token and a malformed token both return 401.
  - **Proposal:** the worked examples above; nothing is stored (the list stays empty afterwards).
  - **Proposal validation boundaries:** Exam Date today rejected, tomorrow accepted, +365 accepted, +366 rejected; Weekly Hours 0 and 41 rejected, 1 and 40 accepted, non-integer rejected; empty, whitespace-only and 101-character Subject rejected.
  - **Proposal invariants**, checked over a grid of inputs (several "today"s and Exam Dates, Weekly Hours 1–40):
    - Activities lie within [today, Exam Date − 1] and have unique dates.
    - The last Activity is on Exam Date − 1.
    - Durations are multiples of 30 minutes and at least 60.
    - Every full 7-day block sums to the Weekly Hours.
    - Types run Learning → Review → Mock Exam.
  - **Save:** the saved Activities equal the Proposal for the same input.
  - **Listing:** the list is ordered by Exam Date and shows correct Progress.
  - **Detail:** Activities in date order.
  - **Marking Activities:** completing and uncompleting update Progress; a future Activity can be completed; repeating the same request is harmless.
  - **Isolation:** another Student's Study Plan returns 404 for get, mark and delete.
  - **Deletion:** after delete, both the Study Plan and its Activities are gone.
  - **Two Study Plans with the same Subject:** both allowed.

### Seam 2: the rendered app (phase 2)

- jest-expo + React Native Testing Library, rendering real routes through Expo Router's testing utilities. The network is stubbed at `fetch` with canned responses that are themselves parsed by the contract schemas, so fakes can't drift from the API. Secure storage is mocked. The device clock is fixed with fake timers, so "today" is deterministic.
- Coverage:
  - Signing in leads to My Plans.
  - A 401 sends the Student back to Login.
  - The empty state.
  - My Plans ordering and the days-left labels, including a passed exam.
  - The New Plan flow: validation messages, Proposal shown, an input change clears it, save opens the Study Plan.
  - Marking and unmarking an Activity, with a failed request rolling back.
  - Today's and Missed Activities are visibly distinguished.
  - Deleting after confirmation returns to My Plans.

### Prior art

None. The repo has no code yet, and these tests establish the patterns.

## Out of Scope

- Any AI or LLM in the app; the Planner is purely rule-based.
- Editing a Study Plan (Subject, Exam Date or Weekly Hours) after it is saved.
- Re-planning or rescheduling Missed Activities.
- Weekly Hours shared across several Study Plans, or scheduling multiple Subjects together.
- Choosing specific weekdays or times of day for studying.
- Notes on Activities, reminders and notifications.
- Email confirmation, password reset, account deletion, social sign-in, and rate limiting or brute-force protection on sign-in.
- Deployment, hosting and app-store builds. The project runs locally: backend on the laptop, app in Expo Go on a phone on the same Wi-Fi.
- Offline use, the web build and languages other than Serbian.

## Further Notes

- **Implementation order:**
  - **Phase 1:** the database schema and the whole backend, with the HTTP API tests, done before any app code.
  - **Hand-off:** the developer creates the Supabase project, pastes the SQL file into the SQL editor, and fills the backend env file.
  - **Phase 2:** visual design with Claude Design, reviewed by the developer, then the app screens, their tests and the API integration.
- **README:** covers Node 22 (`nvm use`), install, Supabase setup and which connection string to copy, env files, finding the laptop's LAN IP, checking `/health` from the phone's browser, starting everything with one command, and opening the app in Expo Go.
- **Trusting "today":** the server trusts the "today" the phone sends. A wrongly set phone clock shifts the plan, which is acceptable for this project.
- **Domain docs:** vocabulary follows `GLOSSARY.md`, and architectural decisions are in `docs/adr/` (0001 Express is the only Supabase client, 0002 one hand-applied SQL schema file, 0003 auth in Express rather than Supabase Auth).
- **Requirement mapping:**
  - enter Subject and Exam Date: stories 13, 14
  - enter Weekly Hours: story 15
  - get a suggested plan: stories 16–25
  - mark an Activity as completed: stories 47–52
  - extras: deleting a Study Plan (54–56), days left and Progress in the list (38–39), today's and Missed Activities highlighted (45–46), list ordered by Exam Date (37)
