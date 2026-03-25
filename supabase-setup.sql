-- Run this in Supabase SQL Editor before starting the app

create table if not exists films (
  id uuid default gen_random_uuid() primary key,
  tmdb_id integer unique not null,
  title text not null,
  poster_path text,
  backdrop_path text,
  overview text,
  release_year integer,
  genres text[],
  runtime integer,
  vote_average numeric,
  media_type text default 'movie',
  status text default 'seen',
  user_rating numeric,
  first_reaction text,
  format_tag text,
  watched_date timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table films enable row level security;
create policy "Allow all" on films for all using (true) with check (true);
