-- Study Planner database schema.
-- Paste this whole file into the Supabase SQL editor and run it once.

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

-- Emails are unique regardless of case.
create unique index if not exists students_email_key on students (lower(email));

create table if not exists study_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students (id) on delete cascade,
  subject text not null check (subject = btrim(subject) and char_length(subject) between 1 and 100),
  exam_date date not null,
  weekly_hours integer not null check (weekly_hours between 1 and 40),
  created_at timestamptz not null default now()
);

create index if not exists study_plans_student_exam_date_idx on study_plans (student_id, exam_date);

create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  study_plan_id uuid not null references study_plans (id) on delete cascade,
  date date not null,
  duration_minutes integer not null check (duration_minutes > 0 and duration_minutes % 30 = 0),
  type text not null check (type in ('learning', 'review', 'mock_exam')),
  completed boolean not null default false,
  -- One Activity per study day.
  unique (study_plan_id, date)
);

-- Only the Express backend reads these tables, connecting as their owner, which
-- RLS doesn't restrict. Enabling RLS with no policies keeps Supabase's
-- auto-generated REST API from exposing them.
alter table students enable row level security;
alter table study_plans enable row level security;
alter table activities enable row level security;
