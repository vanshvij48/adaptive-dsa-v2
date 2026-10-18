create extension if not exists "pgcrypto";

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  leetcode_username text,
  target_role text,
  created_at timestamptz default now()
);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  name text unique not null
);

create table if not exists problems (
  id uuid primary key default gen_random_uuid(),
  leetcode_id text unique,
  title text not null,
  slug text unique,
  difficulty text check (difficulty in ('easy','medium','hard')),
  acceptance_rate numeric,
  created_at timestamptz default now()
);

create table if not exists problem_topics (
  problem_id uuid references problems(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  primary key (problem_id, topic_id)
);

create table if not exists user_problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  problem_id uuid references problems(id) on delete cascade,
  status text check (status in ('SOLVED','ATTEMPTED','NOT_ATTEMPTED')) not null,
  attempts int default 0,
  solved_at timestamptz,
  last_attempted_at timestamptz,
  unique(user_id, problem_id)
);

create table if not exists topic_skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  skill numeric default 0 check (skill >= 0 and skill <= 100),
  recent_accuracy numeric default 0,
  solved_count int default 0,
  updated_at timestamptz default now(),
  unique(user_id, topic_id)
);

create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  score numeric,
  started_at timestamptz default now(),
  completed_at timestamptz
);

create table if not exists assessment_questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references assessments(id) on delete cascade,
  problem_id uuid references problems(id),
  sequence_no int not null,
  difficulty_at_selection text,
  answered_correctly boolean,
  time_seconds int
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  problem_id uuid references problems(id),
  language text not null,
  code text not null,
  status text,
  runtime_ms int,
  memory_kb int,
  submitted_at timestamptz default now()
);

create table if not exists ai_analyses (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid references submissions(id) on delete cascade,
  mistake_type text,
  concept_gap text,
  feedback text,
  recommended_topics jsonb,
  created_at timestamptz default now()
);

create table if not exists roadmap_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  topic_id uuid references topics(id),
  title text not null,
  status text default 'TODO',
  priority numeric default 0,
  scheduled_for date,
  created_at timestamptz default now()
);

alter table profiles enable row level security;
alter table user_problems enable row level security;
alter table topic_skills enable row level security;
alter table assessments enable row level security;
alter table assessment_questions enable row level security;
alter table submissions enable row level security;
alter table ai_analyses enable row level security;
alter table roadmap_items enable row level security;

create policy "users can read own profile"
on profiles for select using (auth.uid() = id);

create policy "users can update own profile"
on profiles for update using (auth.uid() = id);

create policy "users can read own problem progress"
on user_problems for select using (auth.uid() = user_id);

create policy "users can read own skills"
on topic_skills for select using (auth.uid() = user_id);

create policy "users can read own assessments"
on assessments for select using (auth.uid() = user_id);

create policy "users can read own submissions"
on submissions for select using (auth.uid() = user_id);

create policy "users can read own roadmap"
on roadmap_items for select using (auth.uid() = user_id);

insert into topics(name) values
('Array'), ('String'), ('Hash Table'), ('Two Pointer'),
('Sliding Window'), ('Binary Search'), ('Linked List'),
('Stack'), ('Queue'), ('Tree'), ('Graph'), ('Heap'),
('Greedy'), ('Backtracking'), ('Dynamic Programming'),
('Trie'), ('Bit Manipulation')
on conflict (name) do nothing;