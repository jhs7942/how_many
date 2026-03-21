/**
 * E2E 테스트용 Supabase 헬퍼
 * 실제 Supabase DB를 사용하는 통합 테스트에서 활용
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const testClient = createClient(supabaseUrl, supabaseKey);

/** 테스트용 방 생성 */
export async function createTestRoom(mode: 'vote' | 'random' = 'vote') {
  const code = `TEST${Math.random().toString(36).slice(2, 4).toUpperCase()}`;
  const { data, error } = await testClient
    .from('rooms')
    .insert({
      code,
      host_client_id: 'e2e-test-host',
      mode,
      preset: 'custom',
      status: 'waiting',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** 테스트용 방 삭제 */
export async function deleteTestRoom(roomId: string) {
  await testClient.from('rooms').delete().eq('id', roomId);
}

/** 테스트용 후보 추가 */
export async function addTestCandidates(
  roomId: string,
  candidates: { label: string; emoji: string }[]
) {
  const rows = candidates.map((c, i) => ({
    room_id: roomId,
    label: c.label,
    emoji: c.emoji,
    sort_order: i,
  }));
  const { data, error } = await testClient
    .from('room_candidates')
    .insert(rows)
    .select();
  if (error) throw error;
  return data;
}
