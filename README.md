# 몇명이니

모임에서 "오늘 뭐 하지?", "뭐 먹지?"를 10초 만에 결정하는 랜덤 게임 앱.

> 단톡방 30분 토론은 이제 그만! 혼자도, 같이도 빠르게 결정해요.

**운영 URL**: https://how-many-mauve.vercel.app  
**Google Play**: [몇명이니](https://play.google.com/store/apps/details?id=com.howmany.app)

---

## 주요 기능

### 혼자 결정 (Solo)
인원수 기반 활동 추천 또는 직접 입력한 후보 중에서 4종 랜덤 게임으로 결정한다. 결과에서 장소 세부 뽑기도 가능하다.

### 맛집 결정 (Food)
12종 음식 카테고리(한식, 중식, 일식 등) 추천 또는 직접 입력 후 랜덤 게임으로 결정한다. 세부 메뉴 2차 뽑기를 지원한다.

### 같이 결정 (Group)
방장이 방을 만들고 초대 코드를 공유하면, 참여자가 실시간으로 투표한다. Supabase Realtime 기반 멀티 디바이스 동기화.

### 4종 랜덤 게임
| 게임 | 설명 |
|------|------|
| 돌림판 (Spin) | Canvas 기반 룰렛. 재회전 연출 포함 |
| 셔플 (Shuffle) | 컵 셔플 애니메이션 후 선택 |
| 슬롯머신 (Slot) | 3릴 슬롯. nearMiss 연출 포함 |
| 줄뽑기 (Rope) | 줄을 당겨 결과 확인 (6명 이하) |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| UI | React 19 + TypeScript |
| 스타일 | Tailwind CSS v4 + CSS 변수 + 인라인 스타일 |
| 백엔드 | Supabase (PostgreSQL + Realtime) |
| 모바일 | Capacitor (Android WebView) |
| 배포 (웹) | Vercel (git push 자동 배포) |
| 배포 (앱) | Google Play Console |
| 테스트 | Playwright (E2E) |
| 폰트 | Pretendard |

---

## 빠른 시작

### 사전 요구사항
- Node.js 20.x
- npm
- Supabase 프로젝트 (Group 기능 사용 시)

### 설치

```bash
git clone https://github.com/jhs7942/how_many.git
cd how_many
npm install
```

### 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성한다.

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Solo/Food 플로우는 Supabase 없이도 동작한다. Group 플로우와 결과 저장에만 필요하다.

### 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000`에서 확인한다.

---

## 명령어

| 명령어 | 설명 |
|--------|------|
| `npm run dev` | 개발 서버 (localhost:3000) |
| `npm run build` | 프로덕션 빌드 (타입 체크 포함) |
| `npm run lint` | ESLint 실행 |
| `npm run start` | 프로덕션 서버 실행 |
| `npm run build:android` | Android용 정적 빌드 + Capacitor 동기화 |
| `npm run open:android` | Android Studio에서 프로젝트 열기 |

---

## 사용자 플로우

```
혼자 결정 (Solo)
  /solo/setting -> /solo/people -> /solo/location -> /solo/random -> /solo/result
                                                                   -> /solo/place/spin -> /solo/place/result
  /solo/setting -> /solo/custom -> /solo/location -> /solo/random -> /solo/result

맛집 결정 (Food)
  /food/setting -> /food/location -> /food/random -> /food/result
                                                   -> /food/detail/random -> /food/detail/result
  /food/setting -> /food/custom -> /food/location -> /food/random -> /food/result

같이 결정 (Group)
  /group/create -> /group/invite -> /group/nickname -> /group/vote -> /group/lobby -> /group/result
```

---

## 프로젝트 구조

```
how_many/
  app/                    # Next.js App Router 페이지
    solo/                 # 혼자 결정 플로우
    food/                 # 맛집 결정 플로우
    group/                # 같이 결정 플로우
    result/[id]/          # 결과 공유 페이지
    privacy/              # 개인정보처리방침
  components/             # 공용 컴포넌트
    flow/                 # Solo/Food 공용 플로우 컴포넌트
    SpinWheel.tsx         # 돌림판 게임
    ContentShuffle.tsx    # 셔플 게임
    SlotMachine.tsx       # 슬롯머신 게임
    RopePull.tsx          # 줄뽑기 게임
    CandidateEditor.tsx   # 후보 편집기
  lib/                    # 유틸리티, 훅, 데이터
    hooks/                # Supabase Realtime 구독 훅
    data.ts               # 정적 데이터 (활동, 음식, 장소)
    session.ts            # sessionStorage 래퍼
    supabase.ts           # Supabase 클라이언트
    kakao.ts              # 카카오 공유 API
  assets/data/            # JSON 데이터 파일
  android/                # Capacitor Android 프로젝트
  docs/                   # 개발 문서
```

---

## 배포

### 웹 (Vercel)

`main` 브랜치에 push하면 Vercel이 자동 배포한다.

```bash
git push origin main
```

### Android (Google Play)

```bash
# 1. 정적 빌드 + Capacitor 동기화
npm run build:android

# 2. AAB 빌드
cd android
JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home ./gradlew bundleRelease

# 3. 출력 파일
# android/app/build/outputs/bundle/release/app-release.aab
```

빌드된 AAB를 Google Play Console에 업로드한다.

---

## 스타일 가이드

| 항목 | 값 |
|------|------|
| Primary | `#FF7A3D` |
| Background | `#FFF7F2` |
| Text | `#2E2E2E` |
| 최대 너비 | 430px (모바일 앱 형태) |
| 폰트 | Pretendard |
| 디자인 방식 | 인라인 스타일 우선, Tailwind 보조 |

---

## 문서

| 문서 | 경로 | 설명 |
|------|------|------|
| 아키텍처 설계서 | [docs/architecture.md](docs/architecture.md) | 시스템 아키텍처, 데이터 흐름, DB 스키마 |
| 요구사항정의서 | [docs/requirements.md](docs/requirements.md) | 기능/비기능 요구사항, 사용자 시나리오 |
| 환경 설정 가이드 | [docs/setup-guide.md](docs/setup-guide.md) | 개발 환경, 외부 서비스, 배포 설정 |

---

## 라이선스

Private
