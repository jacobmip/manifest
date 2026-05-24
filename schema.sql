-- Run this in the Supabase SQL editor

create table notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text not null default '',
  folder text not null default 'Notes',
  source text not null default 'apple_notes',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  notes text default '',
  due_date timestamptz,
  completed boolean not null default false,
  completed_at timestamptz,
  list_name text not null default 'Reminders',
  source text not null default 'apple_reminders',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
