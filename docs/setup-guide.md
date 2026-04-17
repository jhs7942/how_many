# 환경 설정 가이드

## 1. 개발 환경 요구사항

| 항목 | 버전 | 비고 |
|------|------|------|
| Node.js | 20.x | `package.json` engines 필드에 명시 |
| npm | 10.x+ | Node 20과 함께 설치됨 |
| Git | 최신 | 버전 관리 |
| Android Studio | 최신 | Android 빌드 시에만 필요 |
| JDK | Android Studio 내장 JBR | Android 빌드 시에만 필요 |

---

## 2. 프로젝트 설치

### 2.1 클론 및 의존성 설치

```bash
git clone https://github.com/jhs7942/how_many.git
cd how_many
npm install
```

### 2.2 환경변수 설정

프로젝트 루트에 `.env.local` 파일을 생성한다.

```env
# Supabase (필수 - Group 플로우, 결과 저장)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# 앱 URL (필수 - 결과 공유 링크 생성)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# 카카오 JavaScript SDK (선택 - 카카오톡 공유 기능)
NEXT_PUBLIC_KAKAO_JS_KEY=your-kakao-js-key
```

#### 환경변수 설명

| 변수 | 필수 | 설명 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Group/결과저장 시 | Supabase 프로젝트 URL. Supabase 대시보드 > Settings > API에서 확인 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Group/결과저장 시 | Supabase anon 공개키. 같은 위치에서 확인 |
| `NEXT_PUBLIC_APP_URL` | 필수 | 결과 공유 링크의 기본 URL. 개발 시 `http://localhost:3000`, 운영 시 `https://how-many-mauve.vercel.app` |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 선택 | 카카오 개발자 콘솔에서 발급. 카카오톡 공유 기능에 사용 |

> Solo/Food 플로우의 게임 실행 자체는 Supabase 없이도 동작한다. 결과 저장과 공유만 안 된다.

### 2.3 개발 서버 실행

```bash
npm run dev
```

`http://localhost:3000`에서 확인한다.

---

## 3. 외부 서비스 설정

### 3.1 Supabase

#### 프로젝트 생성

1. [supabase.com](https://supabase.com)에서 계정 생성
2. New Project 클릭
3. 프로젝트 이름, 데이터베이스 비밀번호, 리전(Northeast Asia - ap-northeast-1 권장) 설정
4. 생성 완료 후 Settings > API에서 URL과 anon key 복사

#### 테이블 생성

Supabase SQL Editor에서 아래 테이블을 생성한다.

```sql
-- 방 테이블
CREATE TABLE rooms (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  code text UNIQUE NOT NULL,
  host_client_id text NOT NULL,
  mode text NOT NULL DEFAULT 'vote',
  preset text NOT NULL DEFAULT 'default',
  people_count integer,
  location text,
  time_limit integer NOT NULL DEFAULT 300,
  status text NOT NULL DEFAULT 'waiting',
  vote_started_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 방 후보 테이블
CREATE TABLE room_candidates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  label text NOT NULL,
  emoji text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0
);

-- 참여자 테이블
CREATE TABLE participants (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  nickname text NOT NULL,
  emoji text NOT NULL,
  is_host boolean NOT NULL DEFAULT false,
  last_seen timestamptz,
  joined_at timestamptz DEFAULT now()
);

-- 투표 테이블
CREATE TABLE votes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES participants(id) ON DELETE CASCADE,
  candidate_id uuid REFERENCES room_candidates(id) ON DELETE CASCADE
);

-- 결과 테이블 (Solo/Food/Group 공통)
CREATE TABLE results (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE SET NULL,
  winner_label text NOT NULL,
  winner_emoji text NOT NULL,
  method text NOT NULL,
  is_tie boolean NOT NULL DEFAULT false,
  vote_summary jsonb,
  location text,
  created_at timestamptz DEFAULT now()
);

-- 랜덤 이벤트 테이블 (Group 동기화용)
CREATE TABLE random_events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id uuid REFERENCES rooms(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  seed integer NOT NULL,
  result_index integer NOT NULL,
  is_respin boolean NOT NULL DEFAULT false,
  respin_direction text,
  cup_order integer[]
);
```

#### Realtime 활성화

Supabase 대시보드 > Database > Replication에서 아래 테이블의 Realtime을 활성화한다:
- `rooms`
- `participants`
- `votes`
- `results`
- `random_events`

#### RLS (Row Level Security)

현재 anon 전체 허용 상태이다. 프로덕션 환경에서는 RLS 정책을 추가해야 한다.

```sql
-- 예시: results 테이블 읽기 허용
ALTER TABLE results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read results" ON results FOR SELECT USING (true);
CREATE POLICY "Anyone can insert results" ON results FOR INSERT WITH CHECK (true);
```

### 3.2 카카오 개발자 콘솔

카카오톡 공유 기능을 사용하려면:

1. [developers.kakao.com](https://developers.kakao.com)에서 애플리케이션 등록
2. 앱 설정 > 플랫폼 > 웹에 사이트 도메인 추가
   - `http://localhost:3000` (개발)
   - `https://how-many-mauve.vercel.app` (운영)
3. 앱 키 > JavaScript 키를 `.env.local`의 `NEXT_PUBLIC_KAKAO_JS_KEY`에 설정

---

## 4. 빌드 및 실행

### 4.1 개발 모드

```bash
npm run dev
```

- Hot Module Replacement 지원
- `http://localhost:3000`

### 4.2 프로덕션 빌드

```bash
npm run build
npm run start
```

- TypeScript 타입 체크 포함
- 최적화된 번들 생성

### 4.3 린트

```bash
npm run lint
```

ESLint로 코드 품질 검사.

---

## 5. Android 빌드

### 5.1 사전 요구사항

- Android Studio 설치
- Android SDK (API 26+)
- JDK (Android Studio 내장 JBR 사용)

### 5.2 키스토어 설정

릴리스 빌드를 위해 키스토어가 필요하다.

#### 키스토어 생성 (최초 1회)

```bash
keytool -genkey -v -keystore android/howmany-release.keystore \
  -alias howmany -keyalg RSA -keysize 2048 -validity 10000
```

#### key.properties 생성

`android/key.properties` 파일을 생성한다:

```properties
storePassword=your-store-password
keyPassword=your-key-password
keyAlias=howmany
storeFile=../howmany-release.keystore
```

> `key.properties`와 `.keystore` 파일은 git에 포함하지 않는다. 별도 안전한 곳에 백업한다.

### 5.3 빌드 명령

```bash
# 1. Next.js 정적 빌드 + Capacitor 동기화
npm run build:android

# 2. AAB (Android App Bundle) 빌드
cd android
JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home ./gradlew bundleRelease
```

#### 출력 파일
```
android/app/build/outputs/bundle/release/app-release.aab
```

### 5.4 Android Studio에서 실행

```bash
npm run open:android
```

Android Studio가 열리면 에뮬레이터 또는 실제 디바이스에서 실행할 수 있다.

### 5.5 Capacitor 설정

`capacitor.config.ts`:

| 설정 | 값 | 설명 |
|------|------|------|
| `appId` | `com.howmany.app` | Google Play 패키지 ID |
| `appName` | `몇명이니` | 앱 표시 이름 |
| `webDir` | `out` | 정적 빌드 출력 디렉토리 |
| `server.url` | `https://how-many-mauve.vercel.app` | 웹 앱 URL (WebView 로드) |
| `server.androidScheme` | `https` | Android WebView 스킴 |

---

## 6. 웹 배포 (Vercel)

### 6.1 초기 설정

1. [vercel.com](https://vercel.com)에서 GitHub 리포지토리 연동
2. Framework Preset: Next.js 자동 감지
3. 환경변수 설정:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` = `https://how-many-mauve.vercel.app`
   - `NEXT_PUBLIC_KAKAO_JS_KEY`

### 6.2 배포

```bash
git push origin main
```

main 브랜치 push 시 Vercel이 자동 빌드/배포한다.

> `vercel --prod` CLI 명령은 이 프로젝트에서 동작하지 않는다. 반드시 git push로 배포한다.

### 6.3 제외 파일

`.vercelignore`:
```
android/
test-results/
script.md
CLAUDE.local.md
```

---

## 7. Android 배포 (Google Play)

### 7.1 Google Play Console

1. [play.google.com/console](https://play.google.com/console)에서 앱 등록
2. 앱 ID: `com.howmany.app`
3. 내부 테스트 > 새 릴리스 > AAB 업로드
4. 테스트 완료 후 프로덕션 트랙으로 승격

### 7.2 버전 관리

`android/app/build.gradle`에서 `versionCode`와 `versionName`을 업데이트한다.

```groovy
defaultConfig {
    versionCode 8        // 매 업로드마다 증가
    versionName "1.0.7"  // 사용자 표시 버전
}
```

---

## 8. 테스트

### 8.1 Playwright E2E 테스트

```bash
# Playwright 브라우저 설치 (최초 1회)
npx playwright install

# 테스트 실행
npx playwright test

# UI 모드로 실행
npx playwright test --ui

# 특정 테스트 파일 실행
npx playwright test tests/solo-flow.spec.ts
```

### 8.2 개발 테스트 모드

F10 키를 눌러 `devTestMode`를 토글하면, FlowRandomPage에서 게임 타입을 수동으로 선택할 수 있다. 개발/디버깅 시 특정 게임을 반복 테스트할 때 유용하다.

---

## 9. 디렉토리별 역할 요약

| 디렉토리 | 역할 | 주요 파일 |
|----------|------|----------|
| `app/` | Next.js 페이지 라우트 | `page.tsx`, `layout.tsx` |
| `components/` | React 컴포넌트 | 게임, 에디터, 레이아웃 |
| `components/flow/` | Solo/Food 공용 플로우 | 7개 Flow 컴포넌트 |
| `lib/` | 유틸리티, 타입, 훅 | `data.ts`, `session.ts`, `supabase.ts` |
| `lib/hooks/` | Supabase Realtime 훅 | `useRoomSubscription.ts` 등 7개 |
| `assets/data/` | JSON 정적 데이터 | `foods.json`, `menus.json` |
| `android/` | Capacitor Android | Gradle, 리소스, 키스토어 |
| `docs/` | 개발 문서 | 아키텍처, 요구사항, 설정 가이드 |
| `.claude/` | Claude Code 작업 파일 | 계획, 피드백, 에러 로그 |

---

## 10. 트러블슈팅

### Hydration Error #418

`session.get()`을 컴포넌트 최상위에서 직접 호출하면 발생한다. `useEffect` 내에서 호출해야 한다.

```tsx
// 잘못된 방법
const value = session.get<string>('key');

// 올바른 방법
const [value, setValue] = useState('');
useEffect(() => { setValue(session.get<string>('key') ?? ''); }, []);
```

### Android 빌드 JAVA_HOME 오류

Android Studio 내장 JBR 경로를 명시해야 한다.

```bash
JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home ./gradlew bundleRelease
```

### Vercel CLI 배포 실패

이 프로젝트에서 `vercel --prod`는 동작하지 않는다. `git push origin main`으로만 배포한다.

### Capacitor 환경에서 클립보드 복사 실패

`copyToClipboard()` 함수가 3단계 폴백을 수행한다:
1. Capacitor Clipboard 플러그인
2. `navigator.clipboard.writeText()`
3. `document.execCommand('copy')`

3단계 모두 실패하면 토스트로 에러를 표시한다.
