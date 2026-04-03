# 랜덤의 랜덤 — 재회전 시 최초 결과값 고정 오류

## 발생 환경
- 날짜: 2026-03-19
- 관련 파일: `components/SpinWheel.tsx`
- 라이브러리·버전: React 19, Canvas API

## 증상
돌림판 재회전(50% 확률) 발생 시 재회전 후 새로 멈춘 세그먼트가 아닌,
최초 spin에서 멈춘 세그먼트가 최종 결과로 고정됨.

## 원인
`onResult` 콜백이 첫 번째 spin 완료 시점과 재회전 완료 시점 두 번 호출됨.
첫 번째 호출에서 이미 결과 상태(session, 페이지 이동 등)가 설정되기 때문에
재회전 완료 후 두 번째 `onResult`가 호출되어도 반영되지 않음.

```ts
// 현재 — 첫 결과에서 onResult 호출 후 재회전
spinToIndex(resultIndex, (idx) => {
  if (enableRespin && Math.random() < 0.5) {
    const newIndex = Math.floor(Math.random() * segments.length);
    spinToIndex(newIndex, (finalIdx) => {
      onResult(segments[finalIdx], finalIdx); // 두 번째 호출 — 이미 늦음
    });
  } else {
    onResult(segments[idx], idx); // 첫 번째 호출 — 재회전 전에 결과 확정
  }
});
```

## 해결책
재회전이 발생할 경우 첫 번째 spin 완료 시 `onResult`를 호출하지 않음.
재회전 완료 후 단 한 번만 `onResult` 호출하여 최종 결과 확정.

```ts
spinToIndex(resultIndex, (idx) => {
  if (enableRespin && Math.random() < 0.5) {
    // 첫 결과 커밋 없이 바로 재회전
    const newIndex = Math.floor(Math.random() * segments.length);
    spinToIndex(newIndex, (finalIdx) => {
      onResult(segments[finalIdx], finalIdx); // 최종 결과만 커밋
    });
  } else {
    onResult(segments[idx], idx); // 재회전 없는 경우만 여기서 커밋
  }
});
```

## 재발 방지
- `onResult` 는 최종 결과 확정 시 단 한 번만 호출되어야 함
- 다단계 spin 로직에서 중간 결과를 외부로 노출하지 않도록 설계
- 재회전 여부 판단 → 재회전 시 중간 결과 내부 보류 → 최종 spin 완료 후 커밋 패턴 준수
