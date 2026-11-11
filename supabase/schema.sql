-- ==============================================================================
-- schema.sql
-- 설명: Supabase 초기 스키마 (migrations/001_create_sentiment_analyses_table.sql과 동일)
-- ==============================================================================

create table if not exists public.sentiment_analyses (
  id uuid primary key default gen_random_uuid(),
  input_text text not null,
  sentiment text not null check (sentiment in ('positive', 'negative', 'neutral')),
  confidence integer not null check (confidence between 0 and 100),
  reason varchar(300) not null,
  model text not null,
  created_at timestamptz not null default now()
);

alter table public.sentiment_analyses enable row level security;
