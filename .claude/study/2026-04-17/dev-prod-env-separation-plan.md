# 개발·프로덕션 환경 분리 기획 (앱 개발 초심자용 배경지식 포함)

## 학습 환경
- 날짜: 2026-04-17 / 관련 프로젝트: how_many (몇명이니) / 기술·버전: Capacitor 8.2, Next.js 16.1, Android (AAB), Vercel, Supabase

---

## 배경

### 내가 이 기획을 이해해야 하는 이유
나는 앱 개발이 처음이라 "개발 서버를 분리한다"는 말이 추상적으로 들렸다. 실제로 이 프로젝트는 Google Play Console 내부 테스트 트랙에 올린 앱이 프로덕션과 같은 웹을 바라보고 있어서, **내가 `git push origin main`을 하면 Play Store에서 앱을 쓰고 있는 실사용자 화면이 즉시 바뀐다**. 내부 테스트로 QA 중인 기능이 실사용자에게 노출되는 사고로 이어질 수 있다.

이걸 해결하려면 "환경 분리(environment separation)"라는 업계 관행을 알아야 하고, 우리 앱이 일반 앱과 구조가 어떻게 다른지부터 이해해야 한다.

---

## 핵심 개념

### 1. 우리 앱의 구조 이해 (WebView 하이브리드)

우리 앱은 **진짜 Android 앱이 아니다**. 정확히는 "**웹페이지를 통째로 보여주는 Android 껍데기**"다.

```
┌─────────────────────────────────────────┐
│  Android 앱 (com.howmany.app)           │
│  ┌───────────────────────────────────┐  │
│  │  WebView (크롬 엔진 같은 것)        │  │
│  │                                    │  │
│  │  https://how-many-mauve            │  │
│  │       .vercel.app 을 로드           │  │
│  │                                    │  │
│  │  (= 실제로 보이는 화면은            │  │
│  │     Next.js 웹사이트)              │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

- **Capacitor**: 웹사이트를 Android/iOS 앱으로 감싸주는 도구. 위 그림의 "껍데기"를 만들어줌.
- **`capacitor.config.ts`의 `server.url`**: 껍데기가 실행될 때 로드할 웹 주소. 우리 프로젝트는 `https://how-many-mauve.vercel.app`로 고정되어 있음.
- **APK / AAB**: Android 앱 설치 파일. AAB는 Play Store 전용 최신 포맷.

### 2. 왜 이 구조가 문제를 만드는가

일반 네이티브 앱(예: 계산기 앱)은 앱 내부에 코드가 다 들어있어서 "앱을 업데이트"해야만 화면이 바뀐다. 하지만 WebView 하이브리드는:

| 무엇을 바꾸면 | 네이티브 앱 | 우리 앱 (WebView) |
|---|---|---|
| 버튼 색 변경 | 앱 업데이트 필요 (Play 심사 1~3일) | `git push` → 1분 후 모든 기기에 반영 |
| 새 기능 추가 | 앱 업데이트 필요 | `git push` → 즉시 반영 |
| 앱 아이콘 변경 | 앱 업데이트 필요 | 앱 업데이트 필요 (껍데기 영역) |

→ **웹 배포 = 모든 설치된 앱에 즉시 영향**. 이게 편리함이자 함정.

### 3. 환경(Environment)이란

업계에서 말하는 "환경"은 같은 앱을 **여러 버전으로 병렬 운영**하는 것을 뜻한다.

| 환경 | 목적 | 누가 쓰나 |
|---|---|---|
| **local / dev** | 내 컴퓨터에서 개발 중 | 개발자만 (localhost:3000) |
| **staging** (선택) | 배포 전 최종 리허설 | 팀 내부, QA |
| **production (prod)** | 실제 서비스 | 모든 사용자 |

각 환경은 **웹 주소, 데이터베이스, 앱 패키지명**을 따로 가질 수 있다. 따로 가지면 서로 영향을 안 준다.

### 4. 환경을 분리하는 3가지 축

하이브리드 앱은 세 가지 축을 각각 분리할지 결정해야 한다.

#### 축 1. 웹 URL 분리
- Vercel은 GitHub 브랜치마다 자동으로 다른 URL을 준다.
- `main` 브랜치 → `how-many-mauve.vercel.app` (프로덕션)
- `develop` 브랜치 → `how-many-dev.vercel.app` (개발)
- **돈 안 들고 가장 쉬움**

#### 축 2. Android 앱 패키지 분리 (Build Flavor)
- `applicationId`는 Android가 앱을 식별하는 고유 ID.
- 지금은 `com.howmany.app` 하나만 존재 → 한 기기에 한 버전만 설치 가능.
- **Build Flavor**: Gradle이 제공하는 기능. 하나의 소스 코드에서 여러 앱 버전을 빌드.
  - `prod` flavor → `com.howmany.app`
  - `dev` flavor → `com.howmany.app.dev` (뒤에 `.dev`가 붙음)
- 같은 폰에 **두 앱을 동시에 설치 가능** → 기획자가 프로덕션 앱 안 지우고도 QA 가능.

#### 축 3. 백엔드(DB) 분리
- Supabase 프로젝트를 2개 만들어 URL/키를 환경별로 다르게 주입.
- 장점: dev에서 데이터 망가뜨려도 prod 안전
- 단점: Supabase 비용, 스키마 동기화 수작업
- **10인 이하 팀은 보통 안 함**. 쓰고 버리는 데이터만 있다면 오버킬.

### 5. 배포 채널 (Distribution Channel)

내부 테스터에게 앱을 전달하는 방법도 여러 가지다.

| 방법 | 설명 | 언제 쓰나 |
|---|---|---|
| **Play 내부 테스트 트랙** | Play Console에 AAB 업로드 → 등록된 테스터가 Play Store에서 설치 | 출시 직전 최종 리허설 |
| **Firebase App Distribution** | 링크만 보내면 설치 (Google 계정 필요) | 일상적인 사내 QA |
| **직접 APK 사이드로드** | 파일 전달 → "알 수 없는 앱 허용" 켜고 설치 | 긴급·비공식 테스트 |

업계 관행: **일상 QA는 App Distribution, Play 내부 테스트는 출시 직전만**.

### 6. 비슷한 규모 프로젝트의 표준 구성

2~5인 스타트업 MVP·안정화 단계 하이브리드 앱의 전형:

```
GitHub
 ├─ main 브랜치      ──▶ Vercel prod  ──▶ com.howmany.app      (Play Store)
 └─ develop 브랜치   ──▶ Vercel dev   ──▶ com.howmany.app.dev  (App Distribution)
                                         ↑
                                       같은 폰에 2개 설치 가능
```

- 기획자는 프로덕션 앱으로 실서비스 사용 + DEV 앱으로 QA
- 개발자가 `develop` 브랜치에 푸시 → dev 앱만 반영, prod 앱은 그대로
- `develop` → `main` 머지 시점에 실사용자에게 릴리즈

---

## 실제 적용

### 현재 프로젝트 기획안 (확정되지 않음, 추천 상태)

**Step 1. Vercel 브랜치 분리**
- `develop` 브랜치 생성 → 자동으로 별도 Vercel URL 할당

**Step 2. Capacitor config를 빌드 타임에 주입**
- 현재 `capacitor.config.ts`의 `server.url`이 프로덕션으로 하드코딩됨.
- flavor에 따라 다른 URL이 주입되도록 빌드 스크립트 수정 필요.

```ts
// 개념 예시 (실제 코드 아님, 기획 이해용)
const config = {
  appId: 'com.howmany.app',
  server: {
    url: process.env.FLAVOR === 'dev'
      ? 'https://how-many-dev.vercel.app'
      : 'https://how-many-mauve.vercel.app',
  },
};
```

**Step 3. Android Gradle에 flavor 추가**
- `android/app/build.gradle`의 `android { }` 안에 `flavorDimensions` + `productFlavors` 추가
- `dev` flavor는 `applicationIdSuffix ".dev"`로 패키지명 분리

```groovy
// 개념 예시
flavorDimensions "environment"
productFlavors {
    dev { applicationIdSuffix ".dev"; versionNameSuffix "-dev" }
    prod { }
}
```

**Step 4. Firebase App Distribution 연결 (선택이지만 권장)**
- 기획자 이메일 등록 → dev AAB 업로드 → 링크 클릭으로 설치

**Step 5. 키스토어 결정**
- dev flavor는 **debug 키스토어**로 서명 (개발 편의)
- prod flavor는 **release 키스토어** 유지 (Play Store 필수)

### 적용 후 기대 효과
- 내가 개발 중인 기능을 `develop`에 푸시 → 프로덕션 앱 사용자 영향 0
- 기획자(문은서)는 한 폰에 `몇명이니` + `몇명이니 DEV` 두 앱을 동시 사용
- Supabase는 당분간 공유 → 비용 절감, 추후 필요 시 분리

---

## 주의사항

### 자주 오해하는 부분

1. **"Play 내부 테스트 = 개발 환경"이 아니다**
   - 내부 테스트는 "배포 채널"일 뿐, 앱 자체는 프로덕션 빌드.
   - 환경 분리는 코드 레벨에서 해야 함 (flavor + URL 분리).

2. **`applicationId`를 바꾸면 완전 다른 앱이 된다**
   - `com.howmany.app`과 `com.howmany.app.dev`는 Android 입장에서 남남.
   - Play Console에서도 **별개 앱으로 등록**해야 함.
   - Supabase DB 같은 외부 서비스도 두 앱을 다른 클라이언트로 인식.

3. **WebView는 "앱 버전 ≠ 웹 버전"이 된다**
   - 앱 버전(versionCode 9)은 껍데기 업데이트 주기
   - 웹 버전은 `git push` 주기
   - 두 버전을 어떻게 싱크할지(= 릴리즈 노트 기준) 정책 필요

4. **키스토어는 백업이 생명**
   - release 키스토어를 잃어버리면 같은 앱 ID로 업데이트 불가능 (= 앱 매장에서 사실상 사망).
   - dev flavor도 나중에 Play에 올리려면 dev용 키스토어 별도 백업 필요.

5. **환경 분리를 "서버 여러 개 세우기"로 오해하면 안 됨**
   - Vercel은 서버리스라 "개발 서버 컴퓨터"를 따로 세우는 게 아니라 **브랜치당 URL을 발급받는 개념**.
   - 비용: 개인/Hobby 플랜은 대부분 무료.

### 하지 말아야 할 선택

- dev 환경 만들고 prod DB를 바라보게 설정 → dev에서 실수한 데이터가 prod에 들어감
- flavor 없이 Play Console에 "DEV 용 별도 앱" 수동 업로드 → 관리 복잡, 소스 drift 발생
- QA 끝난 후 dev flavor를 "나중에 지우자"라고 방치 → 실사용자가 실수로 DEV 앱 설치

---

## 참고 자료

- Capacitor 공식 config: https://capacitorjs.com/docs/config
- Android Build Variants: https://developer.android.com/build/build-variants
- Vercel Git 통합 (브랜치별 배포): https://vercel.com/docs/git
- Firebase App Distribution: https://firebase.google.com/docs/app-distribution
- 프로젝트 내 관련 파일:
  - `capacitor.config.ts` (현재 server.url 하드코딩)
  - `android/app/build.gradle` (applicationId 및 signingConfigs)
  - `CLAUDE.md § 배포 설정` (현재 빌드·배포 커맨드)
