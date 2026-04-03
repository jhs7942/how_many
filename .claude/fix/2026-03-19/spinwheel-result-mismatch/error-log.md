# 돌림판 — 표시 결과값과 실제 결과값 불일치

## 발생 환경
- 날짜: 2026-03-19
- 관련 파일: `components/SpinWheel.tsx` (extraRotation 계산 부분)
- 라이브러리·버전: React 19, Canvas API

## 증상
돌림판이 멈춘 위치의 세그먼트와 결과 화면에 표시되는 값이 다름.
예) 돌림판은 "카페"에서 멈췄는데 결과는 "영화"로 표시됨.

## 원인
`extraRotation` 계산에서 비정수 배수를 사용해 회전 완료 후 최종 각도가
의도한 세그먼트 중앙을 벗어남.

```ts
// 현재 — 비정수 배수 (예: 5.73바퀴)
const extraRotation = (5 + Math.random() * 3) * Math.PI * 2;
```

`5 + Math.random() * 3` 은 `5.0 ~ 8.0` 사이의 소수를 포함하는 값.
회전 시작 각도와 합산 시 targetAngle이 의도한 세그먼트 범위를 벗어남.
결과 인덱스 계산(`Math.floor(finalAngle / segmentAngle)`)에서 인접 세그먼트로 밀림.

## 해결책
`Math.floor()` 로 정수 배수 강제 적용.

```ts
// 수정 — 정수 배수 (5~8바퀴 중 하나)
const extraRotation = Math.floor(5 + Math.random() * 4) * Math.PI * 2;
```

## 재발 방지
- 돌림판 회전량은 반드시 `2π` 의 정수 배수로 설정해 시작 각도와 종료 각도의 상대 위치가 일치하도록 할 것
- 결과 인덱스 계산 로직과 extraRotation 계산 로직을 함께 테스트
