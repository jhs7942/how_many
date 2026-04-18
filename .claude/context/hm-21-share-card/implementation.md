## 구현 파일

| 파일 | 역할 | 의존 |
|------|------|------|
| `lib/constants/shareCard.ts` | 공유 카드 스타일 상수 (크기·색상·폰트) + 에러 메시지 매핑 | 없음 |
| `components/ShareCard.tsx` | 오프스크린 공유 카드 DOM 1080x1080. html-to-image 렌더 타겟 | `lib/constants/shareCard.ts` |
| `lib/hooks/useShareImage.ts` | 이미지 생성(generate) + 공유(share) 공용 훅. Web/Capacitor 분기 | `html-to-image` (동적 import), `@capacitor/filesystem` (조건부 import), `@capacitor/share` (조건부 import), `@capacitor/core` |
| `components/SharePreviewModal.tsx` | 공유 전 미리보기 모달. 포커스 트랩 + ESC 닫기 + 외곽 클릭 닫기 | 없음 (독립 컴포넌트) |
| `components/flow/FlowResultPage.tsx` | 기존 "링크 복사" 버튼을 "공유" 버튼으로 교체. ShareCard 오프스크린 마운트 + SharePreviewModal 통합 | `ShareCard`, `SharePreviewModal`, `useShareImage`, `SHARE_ERROR_MESSAGES`, `sanitizeFilename` |
| `lib/utils.ts` | `sanitizeFilename()` 유틸 추가 | 없음 |
| `app/globals.css` | 기존 `spinAnim`을 `spin`으로 통합 (중복 제거) | 없음 |

## 외부 의존 변경

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `html-to-image` | `^1.11.13` | DOM -> PNG 변환. `useShareImage` 내부에서 동적 import |
| `@capacitor/filesystem` | `^8.1.2` | Android Cache 디렉토리에 임시 파일 저장. Capacitor 환경에서만 조건부 import |

## 설계 결정

| 결정 | 이유 | 대안(기각) |
|------|------|-----------|
| `generate()`가 DOM 노드를 직접 받는 구조 | construction.md 원안은 `ShareCardData`를 받아 훅 내부에서 DOM 생성이었으나, React의 ref 기반 렌더가 더 자연스럽고 DOM 생성/정리 로직을 컴포넌트 트리에 위임할 수 있어 ref 기반으로 변경 | 훅 내부 DOM 생성 (React 렌더 사이클 밖에서 DOM 조작 필요 -- 복잡도 증가) |
| ShareCard를 `forwardRef`로 구현 | FlowResultPage에서 ref를 전달받아 오프스크린 DOM에 직접 접근해야 하므로 | createPortal (불필요한 오버헤드) |
| 미리보기 모달을 먼저 열고 이미지 생성 시작 | 사용자에게 즉시 피드백을 주기 위해. blob이 null이면 스피너 표시 | 이미지 생성 완료 후 모달 열기 (사용자 대기 시간 동안 피드백 없음) |
| `shareError` useEffect에서 토스트 + 링크 복사 fallback | render_failed 시 이미지 공유가 불가하므로 기존 링크 복사로 자동 전환. construction.md 11장 에러 처리 매핑 준수 | 에러 시 아무것도 안 함 (UX 손실) |
| permission_denied 시 모달 유지 | 사용자가 Share Sheet를 닫은 것이므로 재공유 시도 가능하도록 | 모달 자동 닫기 (재공유 불편) |
| `handleShareConfirm`을 try/catch로 분기 | share() 호출 후 shareError 상태를 읽으면 stale closure 문제 발생. throw 여부로 분기하면 최신 상태에 의존하지 않음 | shareError 상태 기반 분기 (stale closure 위험) |
| `sanitizeFilename()`을 `lib/utils.ts`에 추출 | FlowResultPage에서 사용. 향후 다른 곳에서도 재사용 가능한 범용 유틸 | useShareImage 내부에 인라인 (재사용 불가) |
| 기존 `spinAnim` 제거 후 `spin`으로 통합 | 동일 애니메이션 중복 제거. `spinAnim`은 코드에서 미사용, `spin`은 3곳에서 사용 | 양쪽 유지 (유지보수 혼란) |

## 파일 간 의존 관계

```
FlowResultPage.tsx
  -> ShareCard.tsx -> lib/constants/shareCard.ts
  -> SharePreviewModal.tsx
  -> lib/hooks/useShareImage.ts -> html-to-image (동적)
                                -> @capacitor/filesystem (조건부)
                                -> @capacitor/share (조건부)
                                -> @capacitor/core
  -> lib/constants/shareCard.ts (SHARE_ERROR_MESSAGES)
  -> lib/utils.ts (sanitizeFilename, copyToClipboard, getAppBaseUrl)
```

## construction.md와의 차이점

| 항목 | construction.md | 실제 구현 | 이유 |
|------|-----------------|-----------|------|
| `generate()` 인터페이스 | `(data: ShareCardData) => Promise<Blob>` | `(node: HTMLElement) => Promise<Blob>` | React ref 기반이 더 자연스러움. ShareCard 컴포넌트가 DOM을 소유하고, 훅은 변환만 담당 |
| ShareCard 오프스크린 마운트 | 훅 내부에서 DOM 생성 | FlowResultPage JSX 내에서 마운트 | React 컴포넌트 트리 안에서 관리가 깔끔 |

## 리뷰 수정 내역 (review.md 반영)

| 이슈 | 심각도 | 수정 파일 | 수정 내용 |
|------|--------|-----------|-----------|
| handleShareConfirm 모달 닫기 로직 버그 | HIGH | `FlowResultPage.tsx` | 빈 조건문 제거. try/catch로 재작성 -- share() throw 시(save_failed/share_unsupported) 모달 닫기, 정상/permission_denied 시 모달 유지 |
| 파일명 sanitize 누락 | HIGH | `FlowResultPage.tsx`, `lib/utils.ts` | `sanitizeFilename()` 유틸 추출 후 handleShareConfirm에서 적용. 한글/영문/숫자/하이픈만 허용, 나머지는 `_`로 치환 |
| ObjectURL revoke 타이밍 갭 | MEDIUM | `SharePreviewModal.tsx` | `useMemo`+`useEffect` 조합을 `useState`+`useEffect` 단일 구조로 변경. Strict Mode에서도 안전 |
| 토스트 중복 호출 | MEDIUM | `FlowResultPage.tsx` | `render_failed` 분기에서 첫 번째 `showToast(msg)` 제거, 통합 메시지 1회만 호출 |
| abortRef 데드 코드 | MEDIUM | `useShareImage.ts` | `abortRef` 선언 및 사용 코드 전체 제거. useRef import도 제거 |
| @keyframes spin 중복 | MEDIUM | `globals.css` | 미사용 `spinAnim` 제거, `spin`만 유지 (3곳에서 참조 중) |

## 주의사항

- **html-to-image는 반드시 동적 import**: `useShareImage.ts`에서 `await import('html-to-image')`로 호출. 정적 import 시 초기 번들 +30KB
- **@capacitor/filesystem은 Capacitor 환경에서만 import**: `Capacitor.getPlatform() !== 'web'` 체크 후 조건부 import. 웹 빌드에서는 로드되지 않음
- **ShareCard의 `position: fixed; left: -99999px`**: 사용자에게 보이지 않지만 DOM에 존재해야 html-to-image가 렌더 가능. `display: none`이면 렌더 불가
- **shareTip vs tip**: `tip`은 화면 표시용 (null 허용), `shareTip`은 공유 카드용 (undefined 허용). 두 변수를 분리한 이유는 TypeScript 타입 호환성
- **기존 버튼 텍스트 변경**: "링크 복사" -> "공유", "카카오 공유" -> "카카오 공유" (유지). 기존 이모지(emoji)도 제거하여 클린한 UI로 통일
- **`scaleIn` 애니메이션**: globals.css에 이미 정의되어 있음. SharePreviewModal에서도 재사용
- **`@keyframes spin`**: 기존 `spinAnim`을 제거하고 `spin`으로 통합. FlowResultPage, SharePreviewModal에서 사용
- **Food 결과 페이지도 FlowResultPage를 사용**: 이번 변경은 FlowResultPage 자체를 수정했으므로 Food 결과 페이지에서도 자동으로 공유 기능이 활성화됨. 이는 plan.md의 "Solo만 사용" 원칙과 미세하게 다르지만, FlowResultPage가 공용 컴포넌트이므로 분리가 불필요. Food 페이지도 `tipData`를 전달하므로 카드 생성에 문제 없음
- **share() 에러 분기**: share() 내부에서 `permission_denied`는 `setError`만 하고 throw하지 않음. `save_failed`/`share_unsupported`는 throw. handleShareConfirm은 이 throw 여부로 분기

## 알려진 제약/미완 항목

- **Group 결과 페이지는 별도 컴포넌트**: Group은 FlowResultPage를 사용하지 않으므로 별도 작업 필요 (HM-21-G)
- **카카오톡 이미지 직접 첨부 불가**: 카톡 feed template은 URL 기반이라 로컬 이미지 첨부 불가. 기존 링크 공유 방식 유지. HM-21-2 (서버사이드 OG)에서 해결 예정
- **iOS 미지원**: `@capacitor/ios` 미설치. Share Sheet 로직은 Capacitor 분기 내에 있으므로 iOS 추가 시 별도 수정 불필요
- **`navigator.share` 미지원 브라우저**: `<a download>` fallback으로 자동 전환되지만, 다운로드만 가능하고 Share Sheet는 열리지 않음
- **[MEDIUM 7] Food 스코프 확장**: review.md에서 지적됨. 사용자 결정 대기 중 (에스컬레이션 항목). FlowResultPage가 공용이므로 Food에서 비활성화하려면 props 분기 필요
