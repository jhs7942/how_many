# Linear HM 팀 Urgent 이슈 일괄 수정 (HM-4 · HM-8 · HM-22)

## 발생 환경
- 날짜: 2026-04-17
- 관련 파일:
  - `lib/hooks/useParticipants.ts`
  - `lib/hooks/useRoomSubscription.ts`
  - `lib/hooks/useRandomEvent.ts`
  - `app/group/lobby/page.tsx`
  - `components/Toast.tsx`
- 라이브러리·버전: Next.js 16.1.7, React 19.2.3, @supabase/supabase-js 2.99.2, Capacitor 8.2.0

---

## 증상

### HM-8 — 대기실 참여자 수 0명 표시 (Urgent)
- Group 플로우 대기실(`/group/lobby`)에서 참여자가 실제로 존재하는데도 **"참여자 0명"** 으로 잠깐 혹은 지속적으로 표시
- 방장이 "참여자가 아직 없다"고 오인해 시작 버튼을 누르지 못하는 상황 보고
- 재현 조건이 불명확했음 (타이밍 이슈 추정)

### HM-22 — 웹↔앱 간 투표 진행 시 방장 외 투표 결과 확인 불가 (Urgent, 팀원 제보)
- 참가자(방장 아닌 사용자)가 웹에서 `how-many-mauve.vercel.app` 접속 중 **"방장을 기다리는 중..." 모래시계 화면에 무한 대기**
- 팀원 코멘트: "웹 로직 문제(세션 무한대기)"
- 방장이 게임을 시작해도 참가자 화면이 전환되지 않는 현상

### HM-4 — 토스트 메시지 시스템 내비바 겹침 (Urgent)
- 일부 Android 기기(특히 Galaxy Jump2 같은 3-버튼 내비게이션 기기)에서 **토스트 메시지 하단이 시스템 네비게이션 바와 겹침**
- 하단 버튼 터치 방해 + UI 가림 현상

---

## 시행착오

### 1차 시도 — 증상별 개별 수정을 검토
처음에는 세 이슈를 독립적 버그로 보고 각각 분리해서 대응하려 했다. 그러나 HM-8과 HM-22의 본질을 코드로 읽어보니 **동일한 fetch-subscribe race condition 패턴**이라는 것이 드러났다.

- `useParticipants`: `sb.from('participants').select()....then(...)` — `await` 없는 fire-and-forget fetch + 동시에 realtime subscribe. 구독 완료 전 발생한 변경을 놓치면 영영 반영되지 않음.
- `useRoomSubscription`: 동일 패턴. 방 status 전이(UPDATE)를 구독 이전에 놓치면 `/group/vote` 등으로 자동 전환되지 않음.
- `useRandomEvent`: 이미 `getLatestRandomEvent` 초기 fetch가 있었지만 `await` 없음 + cancelled flag 없음 → cleanup 안전성 부족.

즉 **근본 원인이 하나**로 좁혀져서 세 훅 모두 같은 패턴으로 개선하기로 결정.

### 2차 시도 — HM-9 / HM-10 중복 확인
이슈 설명대로라면 `FlowResultPage`와 `FlowDetailResultPage`의 버튼 문구가 다른 상태여야 했는데, grep 결과 **양쪽 모두 이미 "다시 돌리기 🔄" / "링크 복사 📤"로 통일**되어 있었다. feedback-2026-04-16.md 작성 이후 어떤 경로로 이미 수정된 상태. 코드 작업 불필요, Linear state만 Done으로 전환.

### 3차 시도 — HM-4 safe-area 값 검증
`Toast.tsx:16`은 이미 `bottom: calc(72px + env(safe-area-inset-bottom, 0px))`로 safe-area를 반영하고 있었다. 그런데도 증상이 발생한다는 것은 **일부 안드로이드 WebView가 `env(safe-area-inset-bottom)`을 0으로 회신**하는 경우가 있다는 의미. 상수 offset 72px만으로는 3-버튼 내비게이션(≈48dp + 여백)을 완전히 피하지 못함.

---

## 원인

### HM-8 — Realtime race (useParticipants)
```ts
// Before
const load = () =>
  sb.from('participants').select().eq('room_id', roomId).then(({ data }) => {
    if (data) setParticipants(data);
  });
load();                                  // ① await 없음
const channel = sb.channel(...)...subscribe();   // ② 동시 진행
```
1. `load()`가 fire-and-forget — 초기값 `[]`이 그대로 노출되는 구간 존재
2. fetch와 realtime INSERT의 race condition
3. `roomId` 변경 시 이전 배열을 clear하지 않음
4. 로딩 상태 미노출 → "로딩 중"과 "참여자 0명"이 시각적으로 동일

### HM-22 — 동일 패턴이 다른 Realtime 훅에도 존재
- `useRoomSubscription`, `useRandomEvent`가 `useParticipants`와 같은 race 구조
- 참가자가 `/group/random` 도달 직후 방장이 `createRandomEvent`를 호출하면,
  realtime `subscribe()`가 완료되기 전의 INSERT를 놓쳐 `event=null`로 고착 → "방장을 기다리는 중..." 무한 대기

### HM-4 — safe-area 회신이 0인 WebView
- 일부 Android WebView에서 `env(safe-area-inset-bottom)`을 0으로 리턴
- 상수 72px은 3-버튼 시스템 네비게이션 + 제스처 힌트 높이를 커버하기에 부족한 경우 존재

---

## 해결책

### 공통 패턴: async/await + cancelled flag + catch-up fetch

세 Realtime 훅 모두 아래 패턴으로 일괄 개선했다.

```ts
useEffect(() => {
  if (!roomId) { /* reset */ return; }

  // roomId 변경 시 state 초기화
  setX(initial);

  const sb = getSupabase();
  let cancelled = false;                // cleanup 안전

  const load = async () => {
    const { data } = await sb.from(...).select()...;
    if (cancelled) return;              // unmount 후 setState 방지
    setX(data);
  };
  load();

  const channel = sb.channel(...)
    .on('postgres_changes', ..., (payload) => {
      if (cancelled) return;
      setX(payload.new);
    })
    .subscribe((status) => {
      // 구독 완료 시점에 catch-up — subscribe 이전 변경 누락 방지
      if (status === 'SUBSCRIBED') load();
    });

  return () => { cancelled = true; sb.removeChannel(channel); };
}, [roomId]);
```

### HM-8: `useParticipants` 반환 형태 변경
```ts
// Before
function useParticipants(roomId): Participant[]

// After
function useParticipants(roomId): { participants, isLoading }
```
호출 측 `app/group/lobby/page.tsx`에서 `isLoading` 중에는 **"참여자 불러오는 중…"** 플레이스홀더 표시. "0명"과 시각적으로 구분.

### HM-22: `useRoomSubscription`, `useRandomEvent` 동일 패턴 적용
두 훅 모두 SUBSCRIBED catch-up fetch + cancelled flag 도입. 기존 API(`Room | null`, `RandomEvent | null`)는 유지.

### HM-4: Toast offset 상향
```ts
// Before
bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))'
// After
bottom: 'max(96px, calc(48px + env(safe-area-inset-bottom, 0px)))'
```
- safe-area 값이 0인 기기에서도 **최소 96px** 보장
- safe-area가 정상 회신되는 기기에서는 `48px + inset`으로 기존과 유사하거나 더 안전한 위치

### HM-9 / HM-10: 코드 변경 없음, Linear state만 Done
```
FlowResultPage.tsx:262 → "다시 돌리기 🔄"
FlowDetailResultPage.tsx:194 → "다시 돌리기 🔄"
FlowResultPage.tsx:226 → "링크 복사 📤"
FlowDetailResultPage.tsx:179 → "링크 복사 📤"
```

### 검증
```bash
npm run build
# ✓ Compiled successfully in 2.0s
# ✓ Generating static pages using 7 workers (32/32)
```

---

## 재발 방지

### 1. Realtime 훅 공통 패턴 고착화
새로운 Supabase Realtime 훅을 만들 때는 반드시 다음 4가지를 포함한다:

1. `async/await`로 fetch — fire-and-forget 금지
2. `cancelled` flag로 cleanup 안전성 확보
3. `subscribe()` 콜백의 `status === 'SUBSCRIBED'` 직후 **catch-up fetch** 한 번 더 호출
4. `roomId` 등 의존성 변경 시 state 초기화

### 2. "로딩 중"과 "데이터 없음"을 시각적으로 구분
훅이 데이터를 반환할 때 `isLoading`(또는 `isReady`) 상태를 함께 노출하여 호출 측에서 3-상태 분기(`loading / empty / populated`)가 가능하게 만든다. 특히 데이터가 "참여자 수 0"처럼 숫자/배열로 표현되는 경우 더 중요하다.

### 3. CSS safe-area는 최소값을 보장해두기
`env(safe-area-inset-bottom)`이 0으로 회신되는 WebView 케이스에 대비하여 중요한 fixed 요소는 `max(상수, calc(...env...))` 패턴으로 floor를 두는 것이 안전하다.

### 4. 팀원 제보 이슈는 초기 단계에서 연관 이슈 그룹화
HM-22(팀원 제보)를 HM-8(내부 인지)과 같은 루트 원인으로 식별한 것이 이번 수정의 핵심이었다. 신규 이슈 리포트 시 기존 이슈 중 증상이 비슷한 것을 먼저 grep하는 습관이 비용 절감에 크게 기여함.

---

## 남은 확인 사항

- [ ] 웹↔앱 다중 기기 재현 테스트 (HM-22의 최종 해결 확인)
- [ ] Galaxy Jump2 실기기에서 토스트 겹침 재확인 (HM-4)
- [ ] WebSocket 재연결 시나리오에서 SUBSCRIBED catch-up이 올바로 동작하는지 추가 관찰

---

## 관련 Linear 이슈
- HM-4 (Urgent, Bug) → In Review
- HM-8 (Urgent, Bug) → In Review
- HM-22 (Urgent, Bug) → In Review
- HM-9 (Urgent, Improvement) → Done (코드 변경 없음)
- HM-10 (Urgent, Improvement) → Done (코드 변경 없음)
