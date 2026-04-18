# Plan — HM-21 결과 공유 카드 이미지화 1단계 (2026-04-18)

## 작업 브랜치

- **현재 브랜치**: `develop` (직커밋)
- Vercel preview URL(`how-many-git-develop-*.vercel.app`)로 자동 배포
- `main` 머지는 실기기 검증 + 기획자 QA 완료 후 사용자 승인 시 별도 진행
- Linear 이슈: HM-21 (https://linear.app/wqeqw/issue/HM-21)

## 작업 배경

결과 확정 화면이 텍스트 중심이라 SNS 공유 시 시각적 임팩트가 약하다. 사용자가 "이걸 공유하고 싶다"고 느낄 만한 **이미지 카드**가 필요하다.

- 기획자 코멘트(2026-04-17): 바이럴 매력 인정. 초기에는 무겁게 가져가지 말고 **클라이언트 카드 이미지화부터 시작**하라는 요청.
- 원래 description은 html2canvas **또는** 서버사이드 OG 이미지였으나, 코멘트에 따라 **1단계는 클라이언트만**. 서버사이드 OG는 실공유 데이터 확인 후 별도 이슈(HM-21-2)로 분리.
- 내부 협의(2026-04-18): 카드 구성은 **컨텐츠 이모지 + 컨텐츠명 + 결과 화면 팁**으로 확정. 브랜드 마크·QR·결과 타입·위치·참여자 정보는 제외.

## 1단계 스코프

- **IN**:
  - Solo 결과 화면에 이미지 생성/공유 기능 추가
  - 공유 카드 = 이모지 + 컨텐츠명 + 팁 + 대표 색상(#FF7A3D) 그라디언트
  - 네이티브 Share Sheet 통합 (`@capacitor/share` 활용)
  - 미리보기 모달 (공유 전 사용자 확인)
- **OUT (1단계 밖, 후속 확장)**:
  - Food / Group 결과 화면 — 공통 훅(`useShareImage`)은 처음부터 공용 설계, 실공유 데이터 확인 후 확장
  - iOS 지원 (`@capacitor/ios` 미설치)
  - 서버사이드 OG 이미지 API (HM-21-2로 분리)
  - 결과 상세 뽑기 화면(`solo/place/result`)
  - 브랜드 마크, QR 코드, 참여자 이모지, Twemoji 강제 적용

## 확정된 카드 스펙

### 해상도 및 비율

- **1:1 정사각형 / 1080×1080**
- 카톡 대화방·인스타 피드·스토리 모두 크롭 없이 업로드 가능

### 레이아웃

```
┌──────────────────────────────────────┐ 1080px
│                                      │
│                                      │
│                                      │
│              🍜                      │   컨텐츠 이모지 520px (면적 48%)
│                                      │
│                                      │
│                                      │
│            라면                      │   컨텐츠명 128px bold
│                                      │
│   🍽️ 웨이팅이 있을 수 있으니         │   팁 44px, 최대 2줄
│       여유 시간을 두세요             │
│                                      │
└──────────────────────────────────────┘
```

### 요소별 스펙

| 요소 | 크기 | 색상 | 비고 |
|---|---|---|---|
| 배경 | 1080×1080 | `linear-gradient(135deg, #FF7A3D 0%, #FF9A6C 100%)` | `var(--color-primary)` 계열 |
| 컨텐츠 이모지 | 520px | 시스템 이모지 (OS별 차이 허용) | `activity.emoji` |
| 컨텐츠명 | 128px bold | `#FFFFFF` | `activity.label` |
| 팁 | 44px regular | `rgba(255,255,255,0.8)` | 결과 화면 `tipData` 재사용, 최대 2줄, 초과 시 `…` 말줄임 |

### 팁 영역 처리 (엣지 케이스)

| 상황 | 처리 |
|---|---|
| `tipData` 제공됨 + `activity.label` 매칭 성공 | 해당 팁 표시 |
| `tipData` 제공됨 + 매칭 실패 | `default` 키 팁 표시 (예: `🎉 즐거운 시간 보내세요!`) |
| `tipData` 자체가 없음 (Group 플로우 등) | **팁 영역 숨김 + 컨텐츠 이모지·컨텐츠명을 카드 수직 중앙에 재배치** |

## 수용 기준 (Acceptance Criteria)

- [ ] Solo 결과 화면에서 "공유" 버튼 탭 시 미리보기 모달 노출
- [ ] 미리보기 모달에서 "공유하기" 탭 시 네이티브 Share Sheet 오픈 (Android/Web)
- [ ] Share Sheet에서 이미지가 카톡·갤러리 등으로 전달됨
- [ ] 생성된 PNG 해상도 1080×1080 (±10px 오차 허용)
- [ ] 미리보기 모달 포함 총 생성 시간 1,000ms 이내 (중급 Android 기준)
- [ ] 카드에 컨텐츠 이모지 + 컨텐츠명 + 팁(있을 때) 정확히 표시
- [ ] 카드 배경은 `var(--color-primary)` 기반 그라디언트
- [ ] 팁 매칭 실패 시 default 팁 사용, `tipData` 자체가 없으면 팁 영역 숨김 + 재배치
- [ ] 팁이 31자 초과(2줄 초과) 시 말줄임 처리
- [ ] 기존 "카카오 공유 / 다시 돌리기 / 홈" 버튼 UX 파괴 없음 (링크 복사 버튼은 Share Sheet에 흡수)
- [ ] 생성 실패 시 토스트 노출 (3종 분기: 권한 거부 / 렌더 실패 / 저장 실패)
- [ ] 생성 중 버튼 disabled + 스피너

## 요구사항

### 기능 요구사항

| # | 요구 | 비고 |
|---|---|---|
| F1 | 결과 카드 DOM을 PNG으로 변환 | 오프스크린 전용 DOM 1080×1080 |
| F2 | "공유" 버튼 탭 → 미리보기 모달 | 자동 생성 아님 |
| F3 | 미리보기 모달에 카드 이미지 표시 | 사용자 확인 후 공유 진행 |
| F4 | Share Sheet 통합 | Web: `navigator.share` + Blob / Capacitor: `@capacitor/share` + Filesystem |
| F5 | 공통 훅 `useShareImage.ts` | Solo/Food/Group 공유 가능한 구조로 설계 (1단계는 Solo만 사용) |
| F6 | 기존 "링크 복사" 버튼을 Share Sheet에 흡수 | 링크·이미지 공유를 단일 시트로 통합 |
| F7 | 카카오 공유 버튼은 별도 유지 | 카톡 이미지 첨부는 서버 이미지 URL 필요 → 1단계에서는 기존 링크 방식 그대로 |
| F8 | 팁 데이터 의존 | `FlowResultPage`의 `tipData` prop을 공유 카드로 그대로 전달 |
| F9 | 팁 없을 때 레이아웃 분기 | `tipData` 미제공 시 이모지·컨텐츠명을 수직 중앙으로 재배치 |

### 비기능 요구사항

| # | 요구 | 기준 |
|---|---|---|
| NF1 | 생성 시간 | 미리보기 포함 1,000ms 이내 (중급 Android) |
| NF2 | 번들 크기 증가 | +50KB 이내 (gzip, 동적 import 적용) |
| NF3 | 접근성 | 버튼 `aria-label`, 생성 중 스크린리더 announce, 모달 포커스 트랩 |
| NF4 | 기존 기능 회귀 없음 | 지도 / 세부 뽑기 / 다시 돌리기 / 홈 버튼 모두 기존대로 동작 |
| NF5 | 보안 | Canvas CORS 회피 (외부 이미지 미사용, 로컬 이모지만 허용) |
| NF6 | Android 15 대응 | Scoped Storage — `@capacitor/filesystem` `Directory.Cache` 사용, Share Sheet로 전달 후 임시 파일 정리 |

## 확정된 기술 선택 (ADR 대상)

| 결정 | 선택 | 주요 근거 |
|---|---|---|
| 이미지 생성 라이브러리 | **`html-to-image`** | gzip ~30KB로 html2canvas보다 작음. SVG foreignObject 방식으로 현대 CSS 지원 양호. React 19 호환 확인 |
| 공유 방식 | **Share Sheet 통합** | `@capacitor/share` 이미 설치. 링크·이미지를 OS 네이티브 시트로 통합해 UX 마찰 최소 |
| 파일 저장 API | **`@capacitor/filesystem` + Share Sheet** | Android 15 Scoped Storage 대응. `Directory.Cache`에 임시 저장 후 Share 후 정리 |
| MVP 플로우 범위 | **Solo 먼저, Food/Group 확장 분리** | 3개 동시 변경 시 러닝비용 3배. 공통 훅은 처음부터 공용 설계 |
| iOS 지원 | **1단계 제외** | `@capacitor/ios` 미설치. 2단계에서 플랫폼 확장 |
| 이모지 렌더 | **system emoji 허용** | 카드 구조 단순 → OS별 차이 영향 미미 |
| 미리보기 모달 | **포함** | 공유 전 확인 UX + 디자인 QA 이중 효과 |
| 카드 비율 | **1:1 (1080×1080)** | 카톡 대화방 공유 핵심 시나리오 최적. 인스타 피드·스토리 양쪽 크롭 없음 |
| 이모지 크기 | **520px (면적 48%)** | 시각 주인공이면서 컨텐츠명·팁과 공존 가능한 균형점 |

## 리스크

| ID | 리스크 | 영향 | 완화 |
|---|---|---|---|
| R1 | 팁 길이 31자 초과 | 카드 하단 오버플로우 | `line-clamp: 2` + `text-overflow: ellipsis`로 2줄 말줄임. 현재 데이터셋 최장 31자로 2줄 내 수용 가능 |
| R2 | `activity.label` 매칭 실패 | 팁 영역 공백 | `tipData['default']` 키 fallback. 모든 `tips.json` / `food-tips.json`에 `default` 키 보장 확인 |
| R3 | 팁 시작 이모지와 컨텐츠 이모지 동일 | 시각 중복 | 현재 데이터셋 기준 실제 충돌 없음 (팁 이모지는 컨텐츠 이모지와 다름). 허용 |
| R4 | `tipData` 미제공 (Group 플로우 등) | 팁 영역 공백 | F9 — 이모지·컨텐츠명을 수직 중앙으로 재배치하는 분기 레이아웃 |
| R5 | `html-to-image` 동적 import 실패 | 공유 기능 전체 장애 | try/catch + 토스트 "이미지 생성에 실패했어요" + 링크 공유로 자동 fallback |
| R6 | Android 15 Scoped Storage 권한 거부 | 갤러리 저장 불가 | Share Sheet로만 전달 → 사용자가 "이미지로 저장" 선택 시 OS가 위치 결정. 앱은 파일 시스템에 직접 쓰지 않음 |
| R7 | 중급 Android 이미지 생성 지연 | NF1 위반 | 실측 후 1080×1080 → 720×720 해상도 하향 대안 유지 |
| R8 | 공유 카드와 화면 카드 디자인 중복 | 유지보수 비용 | 공통 색상·이모지 사이즈 상수를 `lib/constants/shareCard.ts`에 추출 |
| R9 | 카카오톡 이미지 직접 첨부 불가 | 사용자 기대치 ↔ 기능 격차 | 기존 카카오 공유 버튼은 링크 방식 유지. 카톡 이미지 첨부는 HM-21-2 (서버사이드 OG)에서 해결 |

## 작업 순서

1. `html-to-image` + `@capacitor/filesystem` 설치 (번들 크기 기준치 측정)
2. 공용 훅 `lib/hooks/useShareImage.ts` 작성 (Web/Capacitor 분기, 동적 import)
3. 공유 카드 DOM 컴포넌트 `components/ShareCard.tsx` 작성 (오프스크린 렌더 1080×1080, 팁 유무 분기 레이아웃)
4. 미리보기 모달 `components/SharePreviewModal.tsx` 작성
5. `FlowResultPage`에 "공유" 버튼 훅업 (Solo만 사용, Food는 기존 링크 복사 유지)
6. 로컬 검증:
   - Chrome devtools 모바일 뷰에서 공유 시트 동작
   - Android AAB 빌드 → 실기기에서 Share Sheet → 카톡 대화방 전송까지 end-to-end
   - 팁 길이 엣지 케이스(최장 31자, default 매칭) 확인
7. 번들 크기 비교 (`npm run build` 전후)
8. Linear 코멘트 + In Review 전이 → 기획자 QA 재현 요청
9. 재현 완료 시 Done 전이

## 후속 이슈 (본 작업 밖)

- **HM-21-F**: Food 결과 화면에 동일 기능 확장 (이번 작업의 공용 훅 재사용, `tipData` 동일 패턴으로 연결)
- **HM-21-G**: Group 결과 화면에 동일 기능 확장 (팁 영역 숨김 분기 레이아웃 사용)
- **HM-21-2**: 서버사이드 OG 이미지 API — 공유 링크 자동 카드 미리보기, 카톡 이미지 첨부 등. 1단계 배포 후 실공유 지표로 착수 여부 판단
- **iOS 지원**: `@capacitor/ios` 추가와 함께 별도 이슈로 진행
