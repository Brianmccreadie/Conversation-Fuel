-- Conversation Fuel — v1 schema (see docs/ARCHITECTURE.md)
-- Every table is user-scoped with RLS from day one; single-user now,
-- multi-user-ready later.

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- Interests & sources
-- ---------------------------------------------------------------------------

create table interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null,
  why text,
  weight real not null default 1.0,
  subtopics text[] not null default '{}',
  embedding vector(1024),
  status text not null default 'active' check (status in ('active', 'paused')),
  created_at timestamptz not null default now()
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  interest_id uuid references interests (id) on delete set null,
  type text not null default 'rss' check (type in ('rss', 'newsletter_bridge')),
  url text not null,
  title text,
  status text not null default 'active' check (status in ('active', 'paused')),
  last_fetched_at timestamptz,
  failure_count int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, url)
);

create table items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source_id uuid not null references sources (id) on delete cascade,
  url text not null,
  canonical_hash text not null,
  title text not null,
  author text,
  published_at timestamptz,
  content text,
  embedding vector(1024),
  created_at timestamptz not null default now(),
  unique (user_id, canonical_hash)
);

create index items_source_idx on items (source_id);
create index items_published_idx on items (published_at desc);
create index items_embedding_idx on items using hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Downloads & fuel cards
-- ---------------------------------------------------------------------------

create table craft_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source_name text not null,          -- e.g. "Dale Carnegie", "Celeste Headlee"
  principle text not null,
  body text not null,
  tags text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table downloads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  date date not null,
  status text not null default 'pending' check (status in ('pending', 'ready')),
  craft_note_id uuid references craft_notes (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table fuel_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  download_id uuid not null references downloads (id) on delete cascade,
  item_id uuid not null references items (id) on delete cascade,
  position int not null default 0,
  is_wildcard boolean not null default false,
  gist text not null,
  hook text not null,
  story_so_far text,                  -- arc recap for developing stories
  context_item_ids uuid[] not null default '{}',  -- past items used as context
  breakdown jsonb not null default '{}',  -- {facts[], why_it_matters, contested}
  angles jsonb not null default '[]',     -- [{lens, text}]
  questions text[] not null default '{}',
  depth jsonb not null default '{}',      -- {sec30, min2}
  created_at timestamptz not null default now()
);

create index fuel_cards_download_idx on fuel_cards (download_id);

create table card_interests (
  card_id uuid not null references fuel_cards (id) on delete cascade,
  interest_id uuid not null references interests (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  relevance real not null default 0,
  why text,
  primary key (card_id, interest_id)
);

create table interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id uuid not null references fuel_cards (id) on delete cascade,
  action text not null check (action in ('starred', 'used', 'dismissed')),
  landed boolean,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- People
-- ---------------------------------------------------------------------------

create table people (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  relationship text,
  notes text,
  created_at timestamptz not null default now()
);

create table person_interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  person_id uuid not null references people (id) on delete cascade,
  label text not null,
  detail text,                        -- "not just golf — equipment tech"
  embedding vector(1024),
  created_at timestamptz not null default now()
);

create index person_interests_person_idx on person_interests (person_id);

create table card_people (
  card_id uuid not null references fuel_cards (id) on delete cascade,
  person_id uuid not null references people (id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  relevance real not null default 0,
  why text,
  primary key (card_id, person_id)
);

create table capture_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  person_id uuid not null references people (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Pipeline bookkeeping
-- ---------------------------------------------------------------------------

create table ingest_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source_id uuid references sources (id) on delete cascade,
  found int not null default 0,
  added int not null default 0,
  error text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row Level Security: owner-only on everything.
-- The cron pipeline uses the service-role key, which bypasses RLS.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'interests', 'sources', 'items', 'craft_notes', 'downloads',
    'fuel_cards', 'card_interests', 'interactions', 'people',
    'person_interests', 'card_people', 'capture_notes', 'ingest_runs'
  ]
  loop
    execute format('alter table %I enable row level security', t);
    execute format(
      'create policy "owner_all" on %I for all to authenticated
         using (user_id = (select auth.uid()))
         with check (user_id = (select auth.uid()))',
      t
    );
  end loop;
end $$;
