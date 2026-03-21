-- ============================================================
-- how_many RLS 정책 (ver_6)
-- Supabase 대시보드 > SQL Editor에서 실행
-- ============================================================

-- rooms
alter table rooms enable row level security;
create policy "rooms_select" on rooms for select using (true);
create policy "rooms_insert" on rooms for insert with check (true);
create policy "rooms_update" on rooms for update using (true);

-- room_candidates
alter table room_candidates enable row level security;
create policy "room_candidates_select" on room_candidates for select using (true);
create policy "room_candidates_insert" on room_candidates for insert with check (true);

-- participants: is_host 클라이언트 조작 방지
-- host_client_id와 일치할 때만 is_host=true INSERT 허용
alter table participants enable row level security;
create policy "participants_select" on participants for select using (true);
create policy "participants_insert" on participants for insert with check (
  is_host = false OR
  client_id = (select host_client_id from rooms where id = room_id)
);
create policy "participants_update" on participants for update using (true);

-- votes
alter table votes enable row level security;
create policy "votes_select" on votes for select using (true);
create policy "votes_insert" on votes for insert with check (true);

-- results: room_id UNIQUE 제약으로 중복 저장 방지
alter table results enable row level security;
create policy "results_select" on results for select using (true);
create policy "results_insert" on results for insert with check (true);

alter table results
  add constraint results_room_id_unique unique (room_id);

-- random_events
alter table random_events enable row level security;
create policy "random_events_select" on random_events for select using (true);
create policy "random_events_insert" on random_events for insert with check (true);
