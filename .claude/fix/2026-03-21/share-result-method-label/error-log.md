# 공유 페이지에서 모든 게임 방식이 "야바위"로 표시되는 버그

## 발생 환경
- 날짜: 2026-03-21 / 관련 파일: `app/result/[id]/page.tsx` / 라이브러리·버전: Next.js 15

## 증상
공유 링크(`/result/[id]`)를 열면 돌림판·슬롯머신·줄 뽑기·컨텐츠 셔플로 결정한 결과도 전부 "야바위로 결정됐어요"로 표시됨

## 원인
```typescript
// 수정 전
const methodLabel = result.method === 'vote' ? '투표'
  : result.method === 'spin' ? '돌림판'
  : '야바위';  // ← shuffle / slot / rope 모두 여기로 떨어짐
```
`method` 필드는 `'vote' | 'spin' | 'shuffle' | 'slot' | 'rope'` 5종인데, `vote`와 `spin`만 처리하고 나머지는 else 브랜치인 "야바위"로 처리

## 해결책
```typescript
// 수정 후
const methodLabel = {
  vote: '투표',
  spin: '돌림판',
  shuffle: '컨텐츠 셔플',
  slot: '슬롯머신',
  rope: '줄 뽑기',
}[result.method] ?? '랜덤';
```
객체 매핑으로 전환해 모든 method 값을 명시적으로 처리

## 재발 방지
- `method` 타입에 새 값 추가 시 공유 페이지 레이블 매핑도 함께 업데이트
- `group/result/page.tsx`의 methodLabel도 동일 패턴 사용 중이므로 신규 method 추가 시 두 파일 모두 확인 필요
