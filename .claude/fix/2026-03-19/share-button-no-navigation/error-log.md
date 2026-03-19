# 결과 공유하기 — 실제 결과 페이지로 미이동

## 발생 환경
- 날짜: 2026-03-19
- 관련 파일: `app/solo/result/page.tsx` (lines 39–44)
- 라이브러리·버전: Next.js 15 (App Router)

## 증상
결과 공유하기 버튼 클릭 시 `/result/[id]` 페이지로 이동하지 않고 클립보드에 URL이 복사됨.
공유 링크를 받은 상대방이 해당 URL로 접근하면 결과 페이지가 표시되어야 하나,
버튼 누른 본인은 결과 페이지 내에서 그대로 머물게 됨.

## 원인
`handleShare()` 가 `router.push` 대신 `copyToClipboard()` 만 호출함.
`resultId` 가 있어도 페이지 이동 없이 URL 복사만 수행.

```ts
// 현재
const handleShare = async () => {
  const url = resultId ? `${window.location.origin}/result/${resultId}` : window.location.href;
  await copyToClipboard(url);
  showToast('공유 링크가 복사됐어요! 📋');
};
```

## 해결책
`resultId` 존재 시 `router.push('/result/[id]')` 로 이동.
`resultId` 없을 때만 클립보드 복사 fallback 처리.

```ts
const handleShare = async () => {
  if (!activity) return;
  if (resultId) {
    router.push(`/result/${resultId}`);
  } else {
    await copyToClipboard(window.location.href);
    showToast('공유 링크가 복사됐어요! 📋');
  }
};
```

## 재발 방지
- "공유하기" 버튼의 의도를 결과 페이지 이동과 URL 복사로 명확히 구분
- `resultId` 저장 실패 시 fallback 처리(클립보드 복사)가 동작하도록 설계
