<!-- Updated: 2026-03-19 -->
# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 명령어

```bash
npm run dev      # 개발 서버 (localhost:3000)
npm run build    # 프로덕션 빌드 (타입 체크 포함)
npm run lint     # ESLint 실행
npm run start    # 빌드 후 프로덕션 서버 실행
```

## 아키텍처 개요

**백엔드 없음** — 순수 프론트엔드 앱. 페이지 간 상태 전달은 `lib/session.ts` (sessionStorage 래퍼)로만 이루어진다. 서버 액션·API 라우트·DB 없음.

### 두 가지 사용자 플로우

```
혼자 결정 (Solo)
  /solo/people → /solo/spin → /solo/result
                           ↘ /solo/place/spin → /solo/place/result

같이 결정 (Group)
  /group/create → /group/invite → /group/nickname → /group/vote → /group/wait → /group/result
```

**Solo**: 방장이 인원수 선택 → 돌림판으로 활동 결정 → (선택) 장소 세분화까지 2단계 돌림판
**Group**: 방장이 방 생성 + 후보 설정 → 초대 코드 공유 → 각자 닉네임 등록 → 투표 → 집계

### sessionStorage 키 목록

| 키 | 설정 위치 | 사용 위치 |
|----|-----------|-----------|
| `people` | solo/people | solo/spin |
| `activity` | solo/spin | solo/result, solo/place/spin |
| `roomCode` | group/create | group/invite, group/nickname |
| `roomPeople` | group/create | group/wait |
| `candidates` | group/create | group/vote |
| `myNickname` | group/nickname | group/vote, group/wait |
| `myEmoji` | group/nickname | group/vote, group/wait |
| `myVote` | group/vote | group/wait |
| `splashSeen` | app/page.tsx | app/page.tsx |

### 정적 데이터 (`lib/data.ts`)

- `ACTIVITY_DATA`: 인원수(2–6) → 활동 배열
- `PLACE_DATA`: 활동명 → 장소 유형 배열
- `DUMMY_PARTICIPANTS`, `DUMMY_VOTE_RESULTS`: 그룹 결과 화면용 더미 (실시간 집계 미구현)

### 주요 컴포넌트

- **`PageLayout`**: 모든 페이지를 감싸는 `minHeight: 100dvh` flex 컨테이너
- **`SpinWheel`**: Canvas 기반 돌림판. `forwardRef` + `useImperativeHandle`로 `spin()` 메서드 노출. `segments` prop이 바뀔 때마다 재렌더.
- **`Toast` / `useToast`**: 토스트 메시지 훅 + 컴포넌트 세트
- **`BackButton`**: `href` prop으로 이동 경로 지정

### 스타일 규칙

- Tailwind v4 (`@import "tailwindcss"`) + CSS 변수를 `globals.css` `@theme` 블록에 정의
- **인라인 스타일 우선** — Tailwind 클래스는 거의 사용하지 않고 `style={{ }}` 로 작성
- 디자인 토큰: `var(--color-primary)` `#FF7A3D` (주황), `var(--color-bg)` `#FFF7F2`, `var(--color-text)` `#2E2E2E`
- 최대 너비 `430px` (body에 고정), 모바일 앱 형태

## ⚡ ECC 스킬 활용 규칙
다음 상황 발생 시 해당 스킬을 자동으로 적용한다:

- **frontend-patterns**: React 컴포넌트 작성·리팩토링 시 (SpinWheel, CandidateEditor 등)
- **nextjs-turbopack**: Next.js 빌드·성능 최적화 관련 작업 시
- **postgres-patterns**: Supabase DB 쿼리·스키마·인덱스 작업 시 (rooms, votes, results 테이블)
- **e2e-testing**: Solo 또는 Group 플로우 테스트 작성 시
- **security-review**: Supabase RLS 설정·anon key 노출·방 코드 보안 관련 작업 시

---

### Hydration 주의

`session.get()` 은 클라이언트 전용(`typeof window === 'undefined'` 가드 있음).
컴포넌트 최상위 스코프에서 직접 호출하면 **Hydration Error #418** 발생.
반드시 `useEffect` 내부에서 호출하고 `useState`로 보관할 것.

```tsx
// ❌ 잘못된 패턴
const roomCode = session.get<string>('roomCode') ?? '------';

// ✅ 올바른 패턴
const [roomCode, setRoomCode] = useState('------');
useEffect(() => { setRoomCode(session.get<string>('roomCode') ?? '------'); }, []);
```
