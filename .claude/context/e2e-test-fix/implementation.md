## 구현 파일
| 파일 | 역할 | 의존 |
|------|------|------|
| `e2e/solo/solo-flow.spec.ts` | Solo 플로우 E2E 테스트 (7개 테스트) | `app/page.tsx` (splash 로직), `components/flow/FlowSettingPage.tsx` |
| `e2e/solo/slot-machine-e2e.spec.ts` | 4종 게임 타입 E2E 테스트 (spin/shuffle/slot/rope) | `components/RopePull.tsx`, `components/flow/FlowRandomPage.tsx` |
| `e2e/group/group-host.spec.ts` | Group 방장 플로우 E2E 테스트 | `app/group/setting/page.tsx`, `app/group/vote-status/page.tsx`, `app/group/result/page.tsx` |

## 설계 결정
| 결정 | 이유 | 대안(기각) |
|------|------|-----------|
| `page.evaluate()` -> `page.addInitScript()` 전환 | 홈페이지 splash가 useEffect 내에서 client-side state 변경을 일으켜 `page.goto('/')` 직후 execution context가 파괴됨. `addInitScript`는 모든 네비게이션의 document 생성 시점에 실행되므로 context 파괴 전에 sessionStorage를 설정할 수 있음 | `waitForLoadState('networkidle')` 후 `evaluate` -- splash의 setTimeout(2000ms) 대기가 필요해 불안정하고 느림 |
| rope 드래그: `dispatchEvent` -> `page.mouse` API | RopePull 컴포넌트가 `onPointerDown`에서 `e.currentTarget.setPointerCapture(e.pointerId)`를 호출함. `setPointerCapture`는 실제 사용자 입력 이벤트에서만 동작하므로, `dispatchEvent`로 생성한 합성 이벤트에서는 포인터 캡처가 실패하여 이후 `onPointerMove`/`onPointerUp` 이벤트가 핸들러에 전달되지 않음 | `dispatchEvent`에서 delta 값을 더 크게 조정 -- 포인터 캡처 실패 문제는 delta 크기와 무관하므로 근본적 해결 불가 |
| Group vote-status/result 테스트 `test.skip()` 처리 | 두 페이지 모두 `useEffect` init에서 Supabase API (`getRoomById`, `getParticipant`, `getResultByRoomId`)를 호출하고, 실패 시 `router.replace('/')`로 리다이렉트함. Supabase 없는 E2E 환경에서는 API 호출이 타임아웃되어 30초 후 실패 | sessionStorage에 roomId만 설정 -- Supabase API 호출 자체가 실패하므로 roomId 존재 여부와 무관하게 redirect됨 |
| Group setting 테스트는 유지 | `btn-mode-vote`, `btn-mode-random` testid가 실제 `app/group/setting/page.tsx`에 존재하고, Supabase 의존 없이 순수 클릭+네비게이션만 테스트하므로 정상 동작 | -- |
| solo-flow.spec.ts 결과 화면 테스트도 `addInitScript` 패턴 적용 | 기존에 `goto -> evaluate -> reload` 3단계였던 것을 `addInitScript -> goto` 2단계로 단순화. beforeEach의 `addInitScript`와 각 테스트의 `addInitScript`가 모두 적용되어 splashSeen + activity가 함께 설정됨 | -- |

## 파일 간 의존 관계
- `solo-flow.spec.ts` -> `app/page.tsx`: splash 로직 (splashSeen sessionStorage 키)
- `solo-flow.spec.ts` -> `components/flow/FlowSettingPage.tsx`: btn-mode-default testid
- `slot-machine-e2e.spec.ts` -> `components/RopePull.tsx`: touch-action:none 선택자, DRAG_THRESHOLD(60), MAX_DRAG(90) 상수
- `group-host.spec.ts` -> `app/group/setting/page.tsx`: btn-mode-vote, btn-mode-random testid
- `group-host.spec.ts` -> `app/group/vote-status/page.tsx`: Supabase 의존 (getRoomById 등)
- `group-host.spec.ts` -> `app/group/result/page.tsx`: Supabase 의존 (getResultByRoomId 등)

## 주의사항
- `page.addInitScript()`는 해당 page 인스턴스의 모든 후속 네비게이션에 적용됨. 한 테스트 내에서 여러 번 호출하면 모두 누적됨. Playwright는 테스트마다 새 page를 생성하므로 테스트 간 간섭은 없음.
- `addInitScript`에 인자를 전달할 때는 `page.addInitScript((arg) => { ... }, arg)` 형태 사용 (slot-machine-e2e.spec.ts의 CANDIDATES 전달 참고)
- RopePull의 `setPointerCapture`는 React의 synthetic event가 아닌 native DOM event에서만 정상 동작. 향후 RopePull 이벤트 처리 방식이 변경되면 rope 테스트도 재검토 필요
- Group의 vote-status/result 테스트를 활성화하려면 Supabase 테스트 환경 (mock 또는 실제 인스턴스) 설정이 선행되어야 함
