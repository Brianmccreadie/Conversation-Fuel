-- The Ember assistant — conversation memory.
-- One rolling fireside thread per user; "new fire" archives by deleting.

create table ember_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  mode text not null default 'text' check (mode in ('text', 'voice')),
  content text not null,
  created_at timestamptz not null default now()
);

create index ember_messages_user_idx on ember_messages (user_id, created_at);

alter table ember_messages enable row level security;
create policy "owner_all" on ember_messages for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
