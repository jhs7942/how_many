-- 몇명이니 (HowMany) Supabase DB 스키마
-- Supabase SQL Editor에서 실행하세요

-- rooms
create table rooms (
  id              uuid primary key default gen_random_uuid(),
  code            text unique not null,
  host_client_id  text not null,
  mode            text not null,                   -- 'vote' | 'random'
  preset          text not null,                   -- 'default' | 'custom'
  people_count    int,
  location        text,
  time_limit      int not null default 300,        -- 초 단위
  status          text not null default 'waiting', -- waiting | voting | random_playing | finished
  created_at      timestamptz not null default now()
);

-- room_candidates
create table room_candidates (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid references rooms(id) on delete cascade,
  label      text not null,
  emoji      text not null,
  sort_order int not null
);

-- participants
create table participants (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid references rooms(id) on delete cascade,
  client_id  text not null,
  nickname   text not null,
  emoji      text not null,
  is_host    boolean not null default false,
  last_seen  timestamptz,
  joined_at  timestamptz not null default now(),
  unique(room_id, client_id)
);

-- votes
create table votes (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid references rooms(id) on delete cascade,
  participant_id uuid references participants(id) on delete cascade,
  candidate_id   uuid references room_candidates(id) on delete cascade,
  unique(room_id, participant_id)
);

-- results
create table results (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid references rooms(id) on delete set null,
  winner_label  text not null,
  winner_emoji  text not null,
  method        text not null,    -- 'vote' | 'spin' | 'shell'
  is_tie        boolean not null default false,
  vote_summary  jsonb,
  location      text,
  created_at    timestamptz not null default now()
);

-- random_events
create table random_events (
  id               uuid primary key default gen_random_uuid(),
  room_id          uuid references rooms(id) on delete cascade,
  event_type       text not null,    -- 'spin' | 'shell'
  seed             bigint not null,
  result_index     int not null,
  is_respin        boolean not null default false,
  respin_direction text,
  cup_order        int[],
  created_at       timestamptz not null default now()
);

-- RLS: MVP - anon 전체 open
alter table rooms enable row level security;
alter table room_candidates enable row level security;
alter table participants enable row level security;
alter table votes enable row level security;
alter table results enable row level security;
alter table random_events enable row level security;

create policy "anon_all_rooms" on rooms for all to anon using (true) with check (true);
create policy "anon_all_room_candidates" on room_candidates for all to anon using (true) with check (true);
create policy "anon_all_participants" on participants for all to anon using (true) with check (true);
create policy "anon_all_votes" on votes for all to anon using (true) with check (true);
create policy "anon_all_results" on results for all to anon using (true) with check (true);
create policy "anon_all_random_events" on random_events for all to anon using (true) with check (true);

-- Realtime 활성화 (Supabase 대시보드 > Database > Replication 에서 활성화)
-- 또는 아래 SQL로:
alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table votes;
alter publication supabase_realtime add table random_events;
