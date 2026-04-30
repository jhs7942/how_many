# Implementation: HM-20 Group 투표 시간 커스텀

## 배경
- Linear 이슈: HM-20 (Low, Feature)
- 요구: 방 생성 시 1/3/5/10분 중 투표 제한 시간 선택
- 전제 확인:
  - `rooms.time_limit` 컬럼은 이미 DB에 존재 (vote-status/page.tsx:73이 `room.time_limit` 읽고 있음)
  - Room 타입에 `time_limit: number` 정의됨 (lib/types.ts:13)
  - 기존에는 `createRoom`에서 지정 없이 DB default(추정 300)에 의존

## 변경 파일

| 파일 | 변경 |
|---|---|
| `lib/api/rooms.ts` | CreateRoomParams에 `timeLimit?: number` 추가, `insert()`에 `time_limit: params.timeLimit ?? 300` 전달 |
| `app/group/create/page.tsx` | `TIME_LIMIT_OPTIONS` 상수, `timeLimit` state, UI 섹션, handleCreate에서 전달 |

## 설계 결정

### UI 노출 조건
- `mode === 'vote'`일 때만 표시 — random 모드는 투표 개념 없음
- 위치: "후보 편집" 다음, "위치 (선택)" 이전 — 방 생성 옵션 흐름상 자연스러움

### UI 디자인
- 기존 "후보 설정 방식" 행과 동일한 스타일 (border 2px, accent 배경, 14px 폰트)
- 4개 옵션 flex 균등 분할: 1분 / 3분 / 5분 / 10분
- 기본 선택값: 5분(300초) — 기존 default와 동일하여 회귀 위험 없음

### 파라미터 전달
- `createRoom({ ..., timeLimit: mode === 'vote' ? timeLimit : undefined })`
- random 모드에서는 undefined 전달 → `?? 300`으로 DB default와 같은 값 저장

## 검증
- `npm run build` ✅ Compiled successfully (1.9s)
- 타입 체크 통과

## 수동 검증 필요 (QA)
- 각 옵션(1/3/5/10분) 선택 후 방 생성 → vote-status 초기 시간 표시 확인
  - 1분 선택 → `01:00`
  - 3분 선택 → `03:00`
  - 5분 선택 → `05:00`
  - 10분 선택 → `10:00`
- random 모드에서 투표 시간 UI가 **표시되지 않는지** 확인
- 기본값 5분이 선택된 상태로 페이지 진입하는지 확인

## 주의사항
- HM-27 수정(useVoteTimer 초기값 fetch)이 이미 반영되어 있으므로 커스텀 시간도 정상 카운트다운
- Supabase rooms 테이블의 `time_limit` 컬럼이 없거나 타입이 다르면 insert 실패. 현재 코드 전제로는 존재 가정
