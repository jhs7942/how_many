import { useEffect, useState, useRef } from 'react';
import { getSupabase } from '../supabase';
import { getClientId } from '../clientId';

// 방장이 살아있는지(연결되어 있는지) 감지하는 훅.
//
// [학습] Realtime "Presence" — postgres_changes 와 다른 채널 기능
// postgres_changes 가 "DB 행 변경 알림"이라면, presence 는 "지금 이 채널에 누가 접속해있는가"의 실시간 동기화다.
// 즉, DB에 무언가 쓰지 않고도 "방장이 5초 전까지 살아있었다"는 신호를 모든 참여자에게 자동으로 뿌릴 수 있다.
// 새로고침/탭 닫기로 WebSocket이 끊기면 presence가 자동으로 사라지므로, "정상 종료 신호"를 보낼 필요가 없다.
//
// 동작 모델:
// - 방장 측: track({type:'host', timestamp})를 5초마다 보낸다 (heartbeat).
// - 참여자 측: 'sync' 이벤트를 받아 "host" 키가 존재하는지 확인. lastSeenRef 갱신.
//   별도의 5초 타이머로 "마지막으로 본 지 30초가 넘었나?" 검사 → 넘었으면 isHostConnected = false.
export function useHostPresence(roomId: string | null, isHost: boolean) {
  const [isHostConnected, setIsHostConnected] = useState(true);
  // [학습] useRef 가 useState 와 다른 점
  // .current 를 바꿔도 컴포넌트가 다시 렌더되지 않는다. 따라서 "값은 들고 있되 화면에 영향 없는 슬롯"에 적합하다.
  // 여기서 lastSeenRef 는 setInterval 내부에서 비교용으로만 쓰이므로 state로 둘 필요가 없다.
  const lastSeenRef = useRef(Date.now());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const sb = getSupabase();
    const clientId = getClientId();

    // [학습] presence.key — 같은 사용자가 여러 탭을 열었을 때 합쳐서 표시하기 위한 식별자.
    // clientId(localStorage UUID)를 쓰면 한 사람의 여러 탭이 하나의 presence 항목으로 묶인다.
    const channel = sb.channel(`presence:${roomId}`, {
      config: { presence: { key: clientId } },
    });

    if (isHost) {
      // [학습] 방장이 보내는 heartbeat
      // track()을 부를 때마다 metadata가 갱신되어 다른 클라이언트에 sync 이벤트로 전파된다.
      // 5초 간격이면 일시적인 네트워크 끊김에도 30초 임계로 충분히 견딘다.
      channel.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ type: 'host', timestamp: Date.now() });
          intervalRef.current = setInterval(() => {
            channel.track({ type: 'host', timestamp: Date.now() });
          }, 5000);
        }
      });
    } else {
      // [학습] 참여자가 받는 sync — 누가 들어오거나 나갈 때마다 호출된다.
      // presenceState() 는 현재 채널의 모든 참여자 상태를 { key: [presence들] } 형태로 돌려준다.
      // 그 중 type === 'host' 가 있는지만 체크 — 있으면 lastSeen을 갱신.
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          const hostPresent = Object.values(state).some((presences) =>
            (presences as { type: string }[]).some((p) => p.type === 'host')
          );
          if (hostPresent) {
            lastSeenRef.current = Date.now();
            setIsHostConnected(true);
          }
        })
        .subscribe();

      // [학습] 5초마다 "방장 안 본 지 얼마나 됐지?" 검사하는 watchdog.
      // sync 이벤트가 안 오는 케이스(완전 끊김)를 잡아내기 위해 별도 타이머가 필요하다.
      // 30초 임계는 5초 heartbeat의 6배 — 일시적 네트워크 흔들림과 진짜 끊김을 구분하기에 적당.
      intervalRef.current = setInterval(() => {
        if (Date.now() - lastSeenRef.current > 30000) {
          setIsHostConnected(false);
        }
      }, 5000);
    }

    return () => {
      // [학습] cleanup — interval과 channel 둘 다 정리해야 누수 없음.
      // interval만 끄고 channel을 그대로 두면 WebSocket 연결이 살아남는다.
      if (intervalRef.current) clearInterval(intervalRef.current);
      sb.removeChannel(channel);
    };
  }, [roomId, isHost]);

  return isHostConnected;
}
