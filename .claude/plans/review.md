# 코드 리뷰: QA 피드백 10건 수정

## 변경 범위
- 변경 파일: 15개 (게임 컴포넌트 4, flow 컴포넌트 5, 라우트 페이지 3, 공통 컴포넌트 1, 유틸 1)
- 관련 기능: 결과 이동 딜레이, 재회전 메시지, nearMiss 연출, 컵 최소 크기, 설정 설명 개선, 문구 통일, 지도 버튼 브랜드화, 토스트 위치, 이모지셋 분리, 게임 타입 분배 변경

## 발견 사항

### [HIGH] SpinWheel — respin 중 setTimeout cleanup 누락 (메모리 누수/동작 회귀 가능)

- 파일: `components/SpinWheel.tsx:69-75`
- 문제: `spin()` 내부에서 respin 발동 시 `setTimeout(() => { ... }, 600)`을 호출하지만, 이 타이머 ID를 어디에도 저장하지 않는다. 컴포넌트가 600ms 내에 unmount되면 (사용자가 뒤로가기를 누르거나 라우트 전환 시) unmount된 컴포넌트에서 `spinToIndex`가 실행되어 이미 정리된 canvas에 대해 draw()를 호출한다. React strict mode에서 경고가 발생하고, 드물지만 의도치 않은 `onResult` 콜백 실행으로 결과 이중 저장이 발생할 수 있다.
- 수정: `stateRef`에 타이머 ID를 저장하고 컴포넌트 cleanup에서 정리:
  ```tsx
  const respinTimerRef = useRef<ReturnType<typeof setTimeout>>();
  // spin() 내부
  respinTimerRef.current = setTimeout(() => { ... }, 600);
  // useEffect cleanup
  useEffect(() => () => clearTimeout(respinTimerRef.current), []);
  ```

### [HIGH] SlotMachine — nearMiss setTimeout cleanup 누락

- 파일: `components/SlotMachine.tsx:137-141`
- 문제: 3개 릴이 모두 정지한 후 nearMiss 연출 시 `setTimeout(() => retryLastReel(...), 1200)`을 호출하지만, 이 타이머 ID를 저장하지 않는다. 기존 cleanup 로직(`cancelledRef.current = true` + `rafIds.current.forEach(cancelAnimationFrame)`)은 rAF만 정리하고 setTimeout은 정리하지 않는다. 1200ms 내에 unmount되면 `cancelledRef` 체크 덕분에 rAF는 안전하지만, `retryLastReel` 함수 자체는 호출되어 `setStoppedReels`, `setGameState` 등 unmounted 컴포넌트의 setState가 실행된다.
- 수정: setTimeout ID를 ref에 저장하고 cleanup에서 정리:
  ```tsx
  const nearMissTimerRef = useRef<ReturnType<typeof setTimeout>>();
  // startSpin 내부
  nearMissTimerRef.current = setTimeout(() => { ... }, 1200);
  // 기존 cleanup useEffect에 추가
  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      rafIds.current.forEach(cancelAnimationFrame);
      clearTimeout(nearMissTimerRef.current);
    };
  }, []);
  ```
- 비고: `retryLastReel` 내부에서는 `cancelledRef.current`를 체크하므로 rAF 프레임 자체는 안전하게 중단된다. 그러나 함수 진입부의 `setStoppedReels([true, true, false])`, `setGameState('spinning')`은 cancelledRef 체크 이전에 실행된다.

### [MEDIUM] SlotMachine — retryLastReel에서 reelOffsetsRef.current[2] 참조 타이밍

- 파일: `components/SlotMachine.tsx:161`
- 문제: `retryLastReel`은 nearMiss 1200ms 후에 호출되며, `const startY = reelOffsetsRef.current[2]`로 현재 릴 2의 위치를 읽는다. `reelOffsetsRef`는 `useEffect`로 동기화되므로 최신 값이 반영된다. 다만 `setReelOffsets`의 배치 업데이트와 `useEffect` 사이에 한 프레임 지연이 있을 수 있다. 실제로는 1200ms 딜레이 동안 리렌더가 완료되므로 문제가 되지 않을 가능성이 높다.
- 수준: 현재 동작에 실질적 문제 없음. 그러나 `reelOffsetsRef` 동기화를 `useEffect` 대신 `setReelOffsets` 호출 시 직접 갱신하면 더 견고:
  ```tsx
  setReelOffsets(prev => {
    const next = [...prev];
    next[reelIdx] = currentY;
    reelOffsetsRef.current = next; // 즉시 동기화
    return next;
  });
  ```

### [MEDIUM] FlowRandomPage — handleResult 내 gameType non-null assertion

- 파일: `components/flow/FlowRandomPage.tsx:90`
- 문제: `RESULT_DELAY[gameType!]`에서 non-null assertion을 사용한다. `handleResult`는 게임 컴포넌트의 `onResult` 콜백으로 호출되므로 이 시점에 `gameType`이 null일 가능성은 거의 없다. 그러나 코드 안전성 측면에서 fallback(`?? 1000`)이 이미 있으므로 `!` 대신 `gameType ?? ''`로 변경하면 assertion 없이도 동일하게 동작한다.
- 수준: 런타임 문제 없음, 코드 안전성 개선 사항.

### [MEDIUM] ResultClient — window.open 반환값 미처리 + 팝업 차단 대응 없음

- 파일: `app/result/[id]/ResultClient.tsx:95, 115`
- 문제: `window.open()`을 직접 호출하지만:
  1. 반환값(WindowProxy | null)을 확인하지 않아 팝업 차단 시 사용자에게 피드백이 없다
  2. FlowResultPage에서는 `handleMapSearch` 함수로 추상화하여 동일한 패턴을 사용하고 있어 기능적으로는 일관적이나, FlowResultPage에서도 동일하게 팝업 차단 대응이 없다
  3. 모바일 브라우저에서는 대부분 팝업 차단이 적용되지 않으므로(사용자 클릭 이벤트 내부 호출) 실질적 문제 확률은 낮다
- 수준: 모바일 타겟 앱이므로 실질적 영향 낮음. 데스크톱 접근 시에만 잠재적 이슈.

### [MEDIUM] ResultClient / FlowResultPage — 지도 버튼 스타일 코드 중복

- 파일: `app/result/[id]/ResultClient.tsx:93-134`, `components/flow/FlowResultPage.tsx:139-183`
- 문제: 카카오지도/네이버지도 버튼의 스타일과 onClick 핸들러가 두 파일에 거의 동일하게 복사되어 있다. ResultClient는 공유 링크로 접근하는 페이지이고 FlowResultPage는 인앱 결과 페이지로 용도가 다르지만, 지도 버튼 UI는 공통 컴포넌트로 추출 가능하다.
- 수준: DRY 원칙 위반이나 현재 2곳이므로 급하지 않음.

### [LOW] pickGameType — n>=7에서 shuffle 제외 시 ContentShuffle.tsx의 CUP_W 최소값 보장과 모순

- 파일: `lib/utils.ts:20-22`, `components/ContentShuffle.tsx:119`
- 문제: ContentShuffle에서 `CUP_W = Math.max(48, ...)`로 최소 48px을 보장하는 수정을 했는데, pickGameType에서는 n>=7일 때 shuffle을 아예 제외했다. 두 수정이 동시에 적용되어 ContentShuffle의 최소값 보장이 n>=7에서는 사실상 무의미하다. 모순은 아니지만 (n<7에서도 최소값이 작동), n>=7에서 shuffle을 제외한 이유가 "컵이 작아져 가독성 저하"인데 CUP_W 최소값으로 해결을 시도한 것과 방향이 다르다.
- 수준: 의도적 이중 안전장치로 볼 수 있음. 동작에 문제 없음.

## 리뷰 요약

| 심각도 | 건수 | 상태 |
|--------|------|------|
| CRITICAL | 0 | pass |
| HIGH | 2 | warn |
| MEDIUM | 4 | info |
| LOW | 1 | note |

### HIGH 이슈 요약
1. **SpinWheel respin setTimeout 미정리**: unmount 시 respin 타이머가 정리되지 않아 메모리 누수 및 unmounted setState 가능
2. **SlotMachine nearMiss setTimeout 미정리**: 동일 패턴. 1200ms 타이머 미정리로 unmount 후 setState 호출 가능

### Verdict: Warning

CRITICAL 보안 이슈는 없으나, HIGH 이슈 2건이 존재합니다.
- 두 이슈 모두 setTimeout cleanup 누락으로, 빠른 라우트 전환 시 unmounted 컴포넌트의 state 업데이트를 유발할 수 있습니다
- React 18에서는 unmounted setState 경고가 제거되었으나, 의도치 않은 onResult 콜백 실행으로 결과 이중 저장 가능성이 있어 수정 권장합니다
- 나머지 MEDIUM/LOW 이슈는 주의하여 머지 가능합니다

<!-- BLOG_TRIGGER: ai-review | CRITICAL 0건, HIGH 2건 | SpinWheel/SlotMachine에서 setTimeout cleanup 누락으로 unmount 후 setState 및 결과 이중 저장 가능 -->
