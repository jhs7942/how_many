# 코드 리뷰: HM-21 결과 공유 카드 이미지화 1단계

## 변경 범위
- 변경 파일: `lib/constants/shareCard.ts`(신규), `lib/hooks/useShareImage.ts`(신규), `components/ShareCard.tsx`(신규), `components/SharePreviewModal.tsx`(신규), `components/flow/FlowResultPage.tsx`(수정), `package.json`(수정), `app/globals.css`(수정)
- 관련 기능: Solo/Food 결과 화면에 공유 카드 이미지 생성 + 네이티브 Share Sheet 통합

## 발견 사항

### [HIGH] handleShareConfirm에서 모달이 절대 닫히지 않는 로직 버그
- 파일: components/flow/FlowResultPage.tsx:104-112
- 문제: `handleShareConfirm`의 조건문 `if (!shareError || shareError.kind === 'permission_denied')` 블록 내부에 코드가 없다. 모든 에러 케이스(save_failed, share_unsupported)에서도 모달이 닫히지 않으며, 정상 공유 완료 시에도 모달이 닫히지 않는다. 또한 `shareError`는 React 상태이므로 `share()` 호출 직후에 읽으면 이전 렌더의 값을 참조한다(stale closure).
- 수정: `share()`가 에러를 throw하는 경우와 정상 완료를 분기 처리해야 한다. try/catch로 감싸고, 정상 완료 시 모달을 닫거나 성공 토스트를 표시하고, `permission_denied`(사용자 취소)일 때만 모달을 유지하는 로직으로 변경해야 한다.
```tsx
const handleShareConfirm = useCallback(async () => {
  if (!previewBlob || !activity) return;
  const filename = `howmany-${activity.label}.png`;
  try {
    await share(previewBlob, filename);
    // share()가 throw하지 않으면 정상 완료 또는 permission_denied
    // permission_denied 시 모달 유지, 그 외에는 닫기
    // -> share() 내부에서 permission_denied도 throw하지 않으므로
    //    여기 도달 = 성공 또는 사용자 취소
    // 모달 유지 (사용자가 닫기 버튼으로 명시적 닫기)
  } catch {
    // save_failed, share_unsupported 등 -> 에러 useEffect에서 토스트 처리됨
    setShowPreview(false);
    setPreviewBlob(null);
  }
}, [previewBlob, activity, share]);
```

### [HIGH] activity.label이 사용자 입력인데 파일명에 무검증 사용
- 파일: components/flow/FlowResultPage.tsx:106, lib/hooks/useShareImage.ts:84
- 문제: `activity.label`은 직접입력 모드(`custom`)에서 사용자가 자유 입력한 값이다. `howmany-${activity.label}.png`로 파일명을 생성하는데, 경로 구분자(`/`, `\`)나 특수문자가 포함되면 Capacitor Filesystem의 `writeFile`에서 의도치 않은 경로에 파일이 생성될 수 있다(경로 탐색). `Directory.Cache` 범위 내이므로 시스템 전체 탈취는 불가하지만, 예기치 않은 디렉토리 구조 생성이나 에러 발생 가능.
- 수정: 파일명에 사용 불가 문자를 제거하는 sanitize 함수 적용.
```tsx
// 파일명 안전 문자만 허용 (한글, 영문, 숫자, 하이픈)
const safeLabel = activity.label.replace(/[^가-힣a-zA-Z0-9-]/g, '_');
const filename = `howmany-${safeLabel}.png`;
```

### [MEDIUM] SharePreviewModal의 ObjectURL revoke 타이밍 갭
- 파일: components/SharePreviewModal.tsx:24-33
- 문제: `useMemo`로 `URL.createObjectURL(blob)`을 생성하고, `useEffect` cleanup에서 revoke한다. `blob`이 변경되면 새 ObjectURL이 생성되지만, 이전 ObjectURL의 revoke는 cleanup 타이밍에 의존한다. React 18+의 strict mode에서 effect가 두 번 실행되면 첫 번째 URL이 revoke된 뒤 `<img>`가 깨질 수 있다. 다만 이 모달은 strict mode에서도 blob이 null -> Blob 순서로만 변경되므로 실질적 문제 가능성은 낮다.
- 수정: `useMemo` + `useEffect` 조합 대신 `useEffect` 하나에서 생성과 정리를 모두 처리하면 더 안전하다.
```tsx
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
useEffect(() => {
  if (!blob) { setPreviewUrl(null); return; }
  const url = URL.createObjectURL(blob);
  setPreviewUrl(url);
  return () => URL.revokeObjectURL(url);
}, [blob]);
```

### [MEDIUM] 공유 에러 useEffect에서 토스트가 두 번 호출됨
- 파일: components/flow/FlowResultPage.tsx:67-78
- 문제: `render_failed`일 때 `showToast(msg)`로 "이미지 생성에 실패했어요"를 표시한 직후, `showToast('이미지 생성 실패. 링크가 복사됐어요!')`를 다시 호출한다. Toast 구현에 따라 첫 번째 메시지가 두 번째에 의해 즉시 덮어씌워져 사용자는 첫 번째 메시지를 볼 수 없다.
- 수정: `render_failed` 시 두 번째 토스트 메시지만 표시하거나, 하나의 통합 메시지로 변경.
```tsx
if (shareError.kind === 'render_failed' && resultId) {
  copyToClipboard(`${getAppBaseUrl()}/result/${resultId}`);
  showToast('이미지 생성 실패. 링크가 복사됐어요!');
} else if (msg) {
  showToast(msg);
}
```

### [MEDIUM] abortRef 미사용 데드 코드
- 파일: lib/hooks/useShareImage.ts:52, 58
- 문제: `abortRef`가 선언되고 `false`로 설정되지만, 이후 어디서도 `true`로 설정되거나 체크되지 않는다. 이미지 생성 중 컴포넌트 언마운트 시 중단 로직이 없어 잠재적 메모리 누수(언마운트된 컴포넌트의 setState 호출)가 발생할 수 있다.
- 수정: abortRef를 활용한 중단 로직을 구현하거나, 사용하지 않는다면 제거.
```tsx
// 방법 1: 제거
// abortRef 관련 코드 삭제

// 방법 2: 활용
useEffect(() => {
  return () => { abortRef.current = true; };
}, []);
// generate 내부에서:
if (abortRef.current) return; // blob 반환 전 체크
```

### [MEDIUM] @keyframes spin이 spinAnim과 중복
- 파일: app/globals.css
- 문제: 기존 `spinAnim`과 동일한 `@keyframes spin`을 추가했다. implementation.md에서 "의미적으로 분리"라고 설명하지만, 동일한 애니메이션이 두 개 존재하면 유지보수 혼란을 초래한다.
- 수정: 기존 `spinAnim`을 범용 이름으로 통합하거나, 새 컴포넌트에서 `spinAnim`을 직접 사용. 현재 `spinAnim`을 사용하는 컴포넌트가 있다면 점진적 마이그레이션 후 하나로 통합.

### [MEDIUM] Food 결과 페이지에도 공유 기능이 자동 활성화됨 (스코프 확장)
- 파일: components/flow/FlowResultPage.tsx
- 문제: plan.md에서 "Solo만 사용"이라 명시했으나, `FlowResultPage`가 Solo와 Food 양쪽에서 사용되므로 Food 결과 페이지에서도 공유 카드 기능이 활성화된다. implementation.md에서 이를 인지하고 "분리가 불필요"라고 판단했으나, plan.md 스코프와 불일치한다.
- 수정: Food에서도 동작에 문제가 없다면(tipData가 제공됨) plan.md 또는 implementation.md에 스코프 변경 사유를 명시적으로 기록. 이미 implementation.md에 기록되어 있으므로 Linear 이슈 코멘트에도 반영 필요.

### [LOW] ShareCard에 displayName 누락
- 파일: components/ShareCard.tsx:14
- 문제: `forwardRef`로 감싼 컴포넌트에 named function expression(`function ShareCard`)을 사용해 DevTools에는 표시되지만, ESLint의 `display-name` 규칙이 활성화된 경우 경고가 발생할 수 있다.
- 수정: 현재 named function expression 패턴으로 충분하므로 실질적 문제 없음. 참고 사항.

## 리뷰 요약

| 심각도 | 건수 | 상태 |
|--------|------|------|
| CRITICAL | 0 | pass |
| HIGH | 2 | block |
| MEDIUM | 4 | warn |
| LOW | 1 | note |

Verdict: **Warning**

HIGH 이슈 2건은 기능 동작에 직접 영향(모달이 닫히지 않음, 파일명 sanitize 누락)을 주므로 수정 권장. 단, 보안 CRITICAL은 없고 파일명 이슈도 `Directory.Cache` 범위로 제한되어 "Block"까지는 아님.

## 긍정 관찰

- **동적 import 패턴 준수**: `html-to-image`를 `await import()`로 로드하여 초기 번들 영향 제거. construction.md 12장 방침 완벽 준수.
- **Capacitor/Web 분기 일관성**: `Capacitor.getPlatform()` 한 곳에서 분기하고, 각 경로의 에러 처리가 `ShareError` 타입으로 통합되어 있다.
- **오프스크린 DOM 5요소 충족**: `position: fixed`, `left: -99999px`, `top: 0`, `pointerEvents: 'none'`, `aria-hidden: "true"` 모두 적용. `display: none`을 피한 점도 정확.
- **접근성 완비**: 포커스 트랩, ESC 닫기, `role="dialog"`, `aria-modal`, `aria-label` 모두 구현. 생성 중 스피너에 `role="status"` 포함.
- **기존 data-testid 전체 유지**: `result-card`, `result-activity`, `btn-detail`, `btn-share`, `btn-kakao-share`, `btn-retry`, `btn-home` 모두 보존. E2E 호환성 파괴 없음.
- **임시 파일 정리**: Capacitor 경로에서 `Share.share()` 후 `Filesystem.deleteFile()`을 try/catch로 감싸 실패해도 크래시하지 않음.
- **Canvas CORS 회피**: 외부 이미지를 전혀 사용하지 않고, system emoji + 인라인 스타일만 사용하므로 tainted canvas 위험 없음.
- **카카오 공유 버튼 온전 유지**: `btn-kakao-share`는 기존 로직 그대로.

<!-- BLOG_TRIGGER: ai-review | CRITICAL 0건, HIGH 2건 | handleShareConfirm 모달 닫기 로직 누락 + 사용자 입력 파일명 미검증 -->
