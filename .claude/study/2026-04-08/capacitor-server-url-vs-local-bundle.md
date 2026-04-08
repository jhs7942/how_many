# Capacitor 앱 배포 전략: server.url vs 로컬 번들

## 학습 환경
- 날짜: 2026-04-08
- 관련 프로젝트: how_many (몇명이니)
- 기술·버전: Capacitor 8, Next.js 16

---

## 배경

브라우저에서는 정상 동작하는 맛집 결정 기능이 Android 앱에서 보이지 않는 문제가 발생했다. 원인은 Capacitor 앱이 로컬 정적 파일(`out/`)을 로드하는 구조인데, 최신 코드를 빌드·동기화하지 않아 앱에 이전 버전이 남아있었기 때문이었다. 이를 계기로 Capacitor의 두 가지 웹 콘텐츠 제공 방식을 비교 학습했다.

---

## 핵심 개념

### 방식 1: 로컬 번들 (기본값)

Capacitor의 기본 동작. `webDir`에 지정된 정적 빌드 결과물을 앱 내부에 번들링한다.

```ts
// capacitor.config.ts
const config: CapacitorConfig = {
  webDir: 'out',
  server: {
    androidScheme: 'https',
  },
};
```

- 빌드 플로우: `next build` (정적 export) → `npx cap sync` → Android Studio 빌드
- 웹 코드가 APK 안에 포함됨
- 오프라인에서도 웹 UI 로딩 가능

### 방식 2: 원격 URL 로드 (server.url)

앱이 외부 URL을 WebView에 직접 로드한다. 로컬 에셋 불필요.

```ts
// capacitor.config.ts
const config: CapacitorConfig = {
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://how-many-mauve.vercel.app',
  },
};
```

- 배포 플로우: `git push` → Vercel 자동 배포 → 앱에 즉시 반영
- 앱 재빌드 없이 웹 코드 업데이트 가능

### 비교표

| 항목 | 로컬 번들 | server.url (원격) |
|------|-----------|-------------------|
| 배포 속도 | 느림 (빌드→싱크→APK) | 빠름 (git push면 끝) |
| 웹/앱 일관성 | 버전 불일치 가능 | 항상 동일 |
| 오프라인 | UI 로딩 가능 | 불가 |
| 초기 로딩 속도 | 빠름 (로컬) | 네트워크 의존 |
| 앱 스토어 심사 | 유리 | 리젝 가능성 있음 |
| 개발 편의성 | 낮음 | 높음 |

---

## 실제 적용

### 판단 기준: "앱이 오프라인에서 의미가 있는가?"

이 프로젝트(몇명이니)는 Supabase Realtime(그룹 투표), Supabase DB(결과 저장)를 사용하므로 **네트워크 필수**다. 오프라인에서 UI만 로딩되어도 핵심 기능이 동작하지 않는다. 따라서 로컬 번들의 최대 장점(오프라인 지원)이 무의미하다.

**결론**: 베타/개발 단계에서는 `server.url` 방식이 압도적으로 유리.

### 적용 코드

```ts
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.howmany.app',
  appName: '몇명이니',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://how-many-mauve.vercel.app',
  },
};
```

### 개발 시 라이브 리로드 (선택)

```bash
npx cap run android --livereload --external
```

---

## 주의사항

1. **앱 스토어 출시 시에는 로컬 번들로 전환** — Google Play, App Store 모두 순수 웹뷰 앱(웹사이트 래퍼)을 리젝하는 정책이 있다. 출시 전에 `server.url`을 제거하고 로컬 번들로 돌아가는 것이 안전하다.

2. **server.url 사용 시 빌드 동기화를 잊기 쉬움** — 나중에 로컬 번들로 전환할 때 `npm run build:android`를 잊지 말 것. 이번 문제가 정확히 이 케이스였다.

3. **환경 분기 패턴** — 개발/프로덕션을 분리하려면:
   ```ts
   const isDev = process.env.NODE_ENV === 'development';
   server: {
     androidScheme: 'https',
     ...(isDev && { url: 'https://how-many-mauve.vercel.app' }),
   }
   ```

4. **Capacitor 플러그인은 양쪽 모두 동작** — `server.url`을 사용해도 네이티브 플러그인(Haptics, Share, Clipboard 등)은 정상 동작한다. 플러그인은 WebView-네이티브 브릿지를 통해 통신하므로 웹 콘텐츠 소스와 무관하다.

5. **CORS 주의** — 원격 URL 로드 시 Capacitor의 `androidScheme: 'https'`와 Vercel 도메인 간 CORS 이슈가 발생할 수 있다. Supabase 등 외부 API 호출 시 확인 필요.

---

## 참고 자료

- Capacitor 공식 문서 - Server Configuration: https://capacitorjs.com/docs/config#server
- Capacitor 공식 문서 - Mocking Plugins for Testing: https://capacitorjs.com/docs/guides/mocking-plugins
