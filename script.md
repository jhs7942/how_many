# HM-21 재설계 — 카카오 Feed 썸네일 기반 결과 공유 카드

> 새 세션에서 진행용. 2026-04-18 기준. 1단계 초기 구현은 롤백 완료(commit `1e5d1cd`).

---

## 1. 새 세션 시작 프롬프트 (복사해서 사용)

```
HM-21 "결과 공유 카드 이미지화"를 재설계하고 구현해줘.

## 현재 상태
- 이전 구현(html-to-image + Share Sheet)은 2026-04-18에 롤백됨 (commit 1e5d1cd).
- 롤백 사유: 사용자가 원한 것은 "네이티브 Share Sheet 이미지 전송"이 아니라
  "카카오 공유 버튼 → 카카오톡 이동 → 친구에게 전송되는 Feed 메시지의 썸네일에
  랜덤 결과 카드 이미지가 표시"되는 것이었음.
- 참조: `.claude/plans/review.md`, `.claude/context/hm-21-share-card/implementation.md`,
  `.claude/study/adr/2026-04-18/hm-21-share-card-architecture.md` (Superseded 예정)

## 원하는 최종 결과 (예시 참고)
Draw Mafia 처럼 카카오 Feed 카드에:
- 상단 이미지: 결과 카드 (이모지 + 컨텐츠명 + 팁, #FF7A3D 배경)
- 제목: 결과명 (예: 🧺 피크닉)
- 설명: 결과 화면의 팁 또는 "몇명이니로 결정했어요!"
- 링크: 공유 URL (/result/{id})

## 기술 방향 (이미 합의된 부분)
- Next.js 16의 `app/result/[id]/opengraph-image.tsx` (Satori + @vercel/og)
- 카드 비율 1200×630 (Meta OG 표준, 카카오 Feed 권장)
- Twemoji 적용 (Satori는 system emoji 미지원)
- Supabase server client로 results 테이블 조회 (anon key + RLS 공개 읽기)
- `lib/kakao.ts`의 `sendKakaoMessage` 에 imageUrl 추가
- Vercel Edge에서 동적 생성 + 영구 캐시
- `app/result/[id]/page.tsx`의 generateMetadata 에 openGraph 설정 추가
  (카톡 URL 붙여넣기에도 대응)

## 범위
- IN: 결과 공유 URL(/result/{id})을 카톡 공유 시 썸네일 이미지로 노출
- OUT: 네이티브 Share Sheet 이미지 전송, 갤러리 저장 기능, 미리보기 모달
       (이전 롤백된 기능들은 재도입하지 않음)

## 시작 순서
1. `.claude/plans/plan.md` 전면 재작성 (카카오 Feed 중심 스펙)
2. `.claude/plans/construction.md § Part 3` Deprecated 마크 + Part 4 신규 작성
3. 기존 ADR Superseded 전이 + 신규 ADR 작성
4. 사용자 승인 후 구현 착수
```

---

## 2. 핵심 결정 요약 (2026-04-18 합의)

| ID | 항목 | 값 |
|---|---|---|
| D1 | 이미지 비율 | 1200×630 (Meta OG 표준) |
| D2 | 이모지 렌더 | Twemoji 강제 (Satori 제약) — 기존 "system emoji 허용" 번복 |
| D3 | Supabase 읽기 | anon key + `results` 테이블 공개 읽기 RLS 정책 |
| D4 | 기존 구현 처리 | 전면 롤백 완료 (커밋 `1e5d1cd`) |
| D5 | "공유" 버튼 UX | 제거됨, "링크 복사" 복원됨 |
| D6 | E2E | UrlNormalizer 대응 변경은 유지 |

---

## 3. 진행 계획 단계별

### Phase A. 문서 재작성
- [ ] `.claude/plans/plan.md` 전면 재작성
  - 카카오 Feed imageUrl 기반 스펙으로 전환
  - IN/OUT 재정의 (Share Sheet·Filesystem·미리보기 모달 전부 OUT)
  - 수용 기준을 "카톡 썸네일 렌더 확인"으로 재설계
  - 카드 디자인 1200×630 가로형
- [ ] `.claude/plans/construction.md`
  - 기존 Part 3 최상단에 `> Deprecated — 2026-04-18 롤백` 마크
  - 신규 Part 4 작성
- [ ] `.claude/study/adr/2026-04-18/hm-21-share-card-architecture.md`
  - 상태를 `Superseded by hm-21-og-image-satori.md (2026-04-xx)` 로 전이
- [ ] 신규 ADR `.claude/study/adr/2026-04-xx/hm-21-og-image-satori.md` 작성
  - Satori + opengraph-image 컨벤션 채택
  - Twemoji 강제 적용 (D2 번복 근거)
  - 카드 비율 1200×630

### Phase B. 구현 착수 (사용자 승인 후)
- [ ] `app/result/[id]/opengraph-image.tsx` 생성
  - Satori + `ImageResponse` (from `next/og`)
  - Edge runtime 선언
  - `params.id` 로 Supabase `results` 조회
  - activity(label, emoji) + tip (tipsJson 매칭) 획득
  - 1200×630 카드 JSX 렌더
  - Cache-Control: `public, s-maxage=31536000, immutable`
- [ ] `app/result/[id]/page.tsx` metadata 설정
  - `generateMetadata` 로 openGraph.images 주입
  - title, description 도 동적 설정 (카톡 미리보기 전용)
- [ ] `lib/kakao.ts` 수정
  - Feed Template 의 `content.imageUrl` 에 opengraph-image URL 전달
  - `imageWidth: 1200, imageHeight: 630` 명시
- [ ] `lib/constants/shareCard.ts` 신규 (재설계 버전)
  - 가로형 1200×630 색상·크기 상수
- [ ] Satori 전용 폰트 로더
  - 시스템 폰트 접근 불가 → 한글 웹폰트 fetch → ArrayBuffer 캐시
  - Pretendard 또는 Noto Sans KR 권장
- [ ] Supabase RLS 확인
  - `results` 테이블 `select` 정책이 anon에게 열려 있는지 점검
  - 필요 시 `ALLOW SELECT USING (true)` 정책 추가 (Supabase dashboard)

### Phase C. 검증
- [ ] `npm run build` 통과
- [ ] 로컬에서 `/result/{id}/opengraph-image` 직접 호출 → PNG 응답 확인
- [ ] HTML `<head>` 에 `og:image` 메타 주입 확인 (view-source)
- [ ] Vercel preview URL 확인
- [ ] **실기기 카카오톡 테스트** (가장 중요)
  - `@capacitor/share` 기존 카카오 공유 버튼 클릭
  - 친구에게 전송
  - 받은 메시지가 Draw Mafia 스타일 썸네일 카드로 표시되는지
  - 썸네일 클릭 시 `/result/{id}` 로 이동 확인
- [ ] URL 붙여넣기 테스트 (보너스)
  - 카톡 대화방에 결과 URL 텍스트로 붙여넣기
  - 자동 링크 미리보기에 썸네일 나타나는지

### Phase D. 마무리
- [ ] Linear HM-21 상태 전이: In Progress → In Review
- [ ] 기획자 QA 재현 요청 코멘트 (실기기 카톡 전송 시나리오)
- [ ] Done 전이 후 후속 이슈 생성
  - HM-21-F: Food 결과 공유 (동일 endpoint 자동 커버 가능성 높음)
  - HM-21-G: Group 결과 공유 (results 테이블 구조 확인)

---

## 4. 기술 체크리스트 (구현 시 빠뜨리지 말 것)

### Satori 관련 함정
- [ ] **한글 폰트**: Satori는 `noto-sans-cjk` 계열 폰트를 fetch 해야 한글 렌더. 로컬 `public/fonts/` 에 번들 후 `fetch` 하거나 외부 CDN 프록시
- [ ] **이모지**: Satori는 옵션으로 `emoji: 'twemoji' | 'noto' | 'openmoji'` 지원. Twemoji 권장 (라이선스 OK, 외부 fetch)
- [ ] **CSS 지원 범위**: flexbox 기반. grid·float 미지원. linear-gradient 는 OK
- [ ] **JSX 요소 제약**: `<div>`, `<span>`, `<img>` 등 기본만 지원. 컴포넌트 import 가능하되 서버 환경 의식

### Next.js 16 opengraph-image 컨벤션
- [ ] 파일명은 정확히 `opengraph-image.tsx` (복수형, 확장자 `.tsx` 또는 `.jsx`)
- [ ] `export const runtime = 'edge'` 명시
- [ ] `export const alt`, `export const size = { width: 1200, height: 630 }`, `export const contentType = 'image/png'`
- [ ] default export 함수가 `ImageResponse` 반환
- [ ] dynamic route 의 params 받을 수 있음

### Supabase 서버 사이드
- [ ] Edge runtime 에서 `@supabase/supabase-js` 초기화 (service_role 아닌 anon 사용)
- [ ] 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] RLS: `results` 테이블 select 정책 점검. 현재 `/result/[id]` 페이지가 이미 공개 조회하고 있으므로 정책 존재할 가능성 높음
- [ ] 없다면 Supabase dashboard 에서 추가: `CREATE POLICY "public_read" ON results FOR SELECT USING (true);`

### Kakao Feed Template 인자 규격
```ts
Kakao.Share.sendDefault({
  objectType: 'feed',
  content: {
    title: `${emoji} ${label}`,          // 필수
    description: tip ?? '몇명이니로 결정했어요!',
    imageUrl: `${baseUrl}/result/${id}/opengraph-image`,  // 절대 URL
    imageWidth: 1200,
    imageHeight: 630,
    link: {
      mobileWebUrl: `${baseUrl}/result/${id}`,
      webUrl: `${baseUrl}/result/${id}`,
    },
  },
  buttons: [{
    title: '결과 보기',
    link: { mobileWebUrl, webUrl },
  }],
});
```

### 카드 디자인 참고 (1200×630 가로형)
```
┌───────────────────────────────────────────────────────────┐ 1200px
│                                                           │
│                                                           │
│   🧺         피크닉                                       │ 630px
│              🧺 돗자리와 간식을 챙겨가면 더 즐거워요        │
│                                                           │
│                                                           │
└───────────────────────────────────────────────────────────┘
- 좌측(이모지): 360px, 좌측 padding 80px
- 우측(텍스트): 컨텐츠명 96px bold + 팁 32px (2줄 line-clamp)
- 배경: linear-gradient(135deg, #FF7A3D 0%, #FF9A6C 100%)
```

---

## 5. 참조 파일 인벤토리

| 카테고리 | 경로 | 상태 |
|---|---|---|
| plan (구버전) | `.claude/plans/plan.md` | 재작성 필요 |
| construction (구버전 Part 3) | `.claude/plans/construction.md` | Deprecated 마크 + Part 4 추가 |
| review (구버전) | `.claude/plans/review.md` | 이력 유지 |
| implementation (구버전) | `.claude/context/hm-21-share-card/implementation.md` | 이력 유지 |
| ADR (구버전) | `.claude/study/adr/2026-04-18/hm-21-share-card-architecture.md` | Superseded 전이 |
| 학습 노트 | `.claude/study/2026-04-18/architecture-decision-record.md` | 참고 자료 유지 |
| 팁 데이터 | `assets/data/tips.json`, `assets/data/food-tips.json` | OG 이미지에서 사용 |
| 기존 카카오 | `lib/kakao.ts` | imageUrl 추가 수정 |
| 결과 페이지 | `app/result/[id]/page.tsx` | generateMetadata 추가 |

---

## 6. 주의사항 (이번에 다시 빗나가지 말 것)

- **용어 혼동 경계**: "공유 카드" = 카카오 Feed 썸네일. 네이티브 Share Sheet 파일 전송 아님
- **롤백된 파일 재도입 금지**: `useShareImage.ts`, `ShareCard.tsx`, `SharePreviewModal.tsx`, `sanitizeFilename` 전부 제거된 상태 유지
- **html-to-image 재설치 금지**: Satori 로 서버 렌더가 대체함
- **미리보기 모달 재도입 금지**: 서버에서만 카드가 존재하므로 클라이언트 미리보기 가치 낮음. 필요하다면 `<img src="/result/{id}/opengraph-image">` 로 대체
- **1단계 Solo만 스코프 유지**: 단 `opengraph-image` 는 result_id 기반이라 Solo/Food/Group 자동 커버 가능. 테스트는 Solo만, 후속 이슈로 Food/Group 실기기 검증

---

## 7. 새 세션 시작 시 첫 질문 (Claude가 물어볼 것)

1. "롤백된 커밋(`1e5d1cd`) 이후 상태에서 착수하면 될까요?" — 예/아니오
2. "Supabase `results` 테이블의 RLS select 정책 현황 확인해도 될까요?" — 접근 권한
3. "Satori 한글 폰트는 Pretendard / Noto Sans KR 중 어느 쪽?" — 사용자 선호
4. "Twemoji 외부 fetch vs 로컬 번들?" — 성능·안정성 트레이드오프

---

## 8. 검증된 환경 정보 (2026-04-18 기준)

- Next.js `16.1.7`
- React `19.2.3`
- Capacitor `^8.2.0` (android)
- @supabase/supabase-js `^2.99.2`, @supabase/ssr `^0.9.0`
- Node `20.x`
- 배포: Vercel (auto deploy on develop push)
- 내부 테스트 AAB: develop 브랜치 preview URL 사용
- Linear HM-21: state `Todo`, assignee 정현승

---

---

## [보존] 별개 QA 피드백 — 영상 QA (2026-04-18)

> HM-21 과 무관한 QA 피드백. 별개 이슈로 처리 예정 (아직 Linear 미등록).

### 첫번째 영상
- 후보설정방식이 인원기반, 직접입력 이렇게 2가지로 나누어져있는데, 정확하게 어떤게 다른건지 명확하지 않은 느낌
- 마지막부분에 볼링이 들어가있지도 않은데 선택되어 있음

### 두번째 영상
- 컨텐츠 셔플 목록이 많아지면 너무 과하게 아이콘들의 크기가 줄어들어 보기가 불편함
- 룰렛을 돌리는데 처음 룰렛에 접근하면 한번 돌려지고 또한번 돌려지는데, 의도된거였다면 "한번더!" 이런식으로 명확한 표시 필요 *(현재 반영 확인 필요)*
- 룰렛이 돌려지고 바로 결과로 이동 → 조금 텀을 두고 결과로 이동하게 하여 잭팟 표시하는 것은 어떨까
- 슬롯머신 무작위의 경우에도 3개 중 2개만 동일한 값으로 나와도 재밌는 요소가 되지 않을까
