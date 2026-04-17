# Next.js Turbopack `.next` 캐시 혼재(cache bleed) 이슈 — 배경지식부터 상세 정리

## 학습 환경
- 날짜: 2026-04-17
- 관련 프로젝트: how_many (Next.js 16.1.7 + React 19.2.3 + Capacitor 모바일 앱)
- 기술·버전: Next.js 16.1.7, Turbopack (Next.js 내장), App Router

---

## 배경

로컬에서 `npm run dev`를 실행했더니 요청은 200으로 정상 응답되는데, 중간중간 다음과 같은 FATAL 로그가 반복적으로 출력됐다.

```
FATAL: An unexpected Turbopack error occurred.
A panic log has been written to /var/folders/32/.../T/next-panic-*.log
To help make Turbopack better, report this error by clicking here.
```

panic log를 열어봤더니 `"Next.js package not found"`가 수십 번 반복 기록되어 있었다. 실제로 `node_modules/next`는 멀쩡히 존재하는데 왜 이 에러가 나는지 맥락을 이해하려면 Next.js가 내부적으로 어떻게 동작하는지 배경지식이 필요했다.

그 배경에는 직전 작업 흐름이 있었다:
1. Realtime race 수정(HM-8, HM-22)과 Toast safe-area 수정(HM-4)을 반영
2. 검증 목적으로 `npm run build` 실행 → 성공
3. 로컬 테스트용으로 바로 `npm run dev` 실행 → FATAL 반복

즉 `build` 직후 `dev`를 올린 것이 문제의 트리거였다.

---

## 핵심 개념

### 1. Next.js의 두 가지 실행 모드

| 모드 | 명령 | 용도 | 출력물 |
|---|---|---|---|
| **Development** | `next dev` | 로컬 개발 (HMR 포함) | `.next/dev/` 하위 중심 |
| **Production Build** | `next build` | 배포용 최적화 빌드 | `.next/` 루트 + `BUILD_ID`, `build-manifest.json` 등 |
| **Production Start** | `next start` | 빌드 결과로 서버 실행 | `.next/` 루트 사용 (read-only) |

두 모드는 **같은 `.next/` 폴더를 공유**한다. 이게 이번 이슈의 실마리.

### 2. `.next/` 디렉토리가 담고 있는 것

빌드/개발 산출물이 한 군데에 모인다. 파일 이름만 봐도 어느 모드 결과인지 알 수 있다.

| 파일/폴더 | 생성 주체 | 역할 |
|---|---|---|
| `BUILD_ID` | `build` | 프로덕션 빌드 식별자 (해시) |
| `build-manifest.json` | `build` | 페이지별 번들 매핑 |
| `export-marker.json` | `build` | 정적 export 여부 표식 |
| `next-server.js.nft.json` | `build` | 서버 실행에 필요한 파일 트레이스 |
| `dev/` | `dev` | Turbopack의 HMR 작업 공간 |
| `cache/` | 공용 | 모듈 변환 결과 캐시 |

프로덕션 빌드가 남긴 `BUILD_ID`나 `export-marker.json` 등은 dev 모드 입장에선 "외계 파일"인데, Turbopack이 컴파일 컨텍스트를 구성할 때 폴더를 스캔하다 이 파일들을 발견하면 판단이 흔들린다.

### 3. Turbopack이란

Next.js에 내장된 **Rust 기반 번들러**. Webpack을 대체하기 위해 Vercel이 만들었다. Next.js 16부터 기본값.

특징:
- 빠른 incremental compilation (바뀐 부분만 재컴파일)
- Rust의 Salsa 스타일 memoization 프레임워크 `turbo-tasks` 기반
- 각 컴파일 단계가 "task"로 메모이제이션되며, task들은 의존성 그래프를 이룸

### 4. HMR (Hot Module Replacement)

- 개발 중 코드를 바꾸면 **페이지 전체 리로드 없이** 바뀐 모듈만 교체하는 기술
- 브라우저와 dev 서버는 WebSocket으로 연결되어 있음
- 서버는 파일 변경을 감지하면 새 모듈을 번들링 → WebSocket으로 브라우저에 푸시

이번 panic 에러 체인의 시작점이 `Project::hmr_version_state`였다. 즉 "현재 코드의 HMR 버전(해시)이 뭐냐"를 계산하는 task에서 실패.

### 5. 이번 panic 에러 체인 해석

```
Project::hmr_version_state          ← HMR 버전 계산 시도
  VersionedContentMap::get          ← 컨텐츠 맵 조회
    endpoint_output_assets          ← 엔드포인트 출력 자산 수집
      AppEndpoint::output           ← /page 출력
        get_server_resolve_options_context ← 서버 resolve 컨텍스트 생성
          get_next_server_import_map       ← Next.js import map 생성
            FAIL: "Next.js package not found"
```

`get_next_server_import_map`은 dev 서버가 "다음 코드를 실행할 때 `next/*` 경로를 어디로 해석할지"를 결정하는 매핑을 만든다. 이 작업 중 Turbopack이 `.next/` 루트에 남아 있던 **프로덕션 빌드 메타파일**을 우선 참조하려 했고, 해당 메타의 내부 참조가 dev 컨텍스트와 어긋나면서 "next 패키지를 못 찾겠다"는 false negative를 내는 것.

즉 **실제 패키지 부재가 아니라 resolve context 오염**이다.

### 6. 왜 로그가 200과 FATAL이 섞여서 반복되는가

- FATAL이 떠도 dev 서버 프로세스 자체는 죽지 않음 (Turbopack은 task 단위 panic을 catch해 복구)
- `GET /` 200은 **이전에 캐시된 페이지 버전**으로 응답 → 그래서 브라우저에는 에러가 안 보임
- 그런데 HMR WebSocket은 panic 때마다 끊김 → 브라우저가 자동 재연결 시도
- 재연결 → Turbopack이 `hmr_version_state`를 다시 계산 → 같은 panic 재발
- 이 루프가 FATAL 로그를 계속 찍는 원인

---

## 실제 적용

### 문제 진단에 사용한 read-only 조사

```bash
# 1. next 패키지가 실제로 있는지
ls node_modules/next/package.json
# → -rw-r--r-- 정상 존재

# 2. CLI 심볼릭 링크 유효성
readlink node_modules/.bin/next
# → ../next/dist/bin/next  (정상)

# 3. .next 디렉토리 상태 (핵심 증거)
ls -la .next/
# → BUILD_ID, build/, build-manifest.json, export-marker.json  ← build 산출물 (16:11)
# → dev/                                                        ← dev 작업 폴더 (16:27)
# 두 모드 산출물이 한 폴더에 혼재

# 4. 중복 프로세스 없는지
ps aux | grep -E "next dev|next-server|turbopack" | grep -v grep
# → 출력 없음 (중복 아님)
```

이 4가지로 "패키지는 멀쩡, 프로세스도 하나만, 문제는 `.next` 상태"라는 결론에 도달.

### 해결 조치 (터미널에서 실행)

```bash
# 1. dev 서버 중지
Ctrl + C

# 2. 혼재된 캐시 비우기
rm -rf .next .turbo node_modules/.cache

# 3. dev 서버 재시작
npm run dev
```

### 재발 방지 루틴

`.next`를 오염시키지 않는 검증 방법으로 바꾼다.

```bash
# build 대신 타입 체크만 — .next를 건드리지 않음
npx tsc --noEmit
```

`next build`를 꼭 돌려야 한다면 **반드시 직후**에 `rm -rf .next`를 끼워 넣는다.

---

## 주의사항

### 헷갈리기 쉬운 포인트

1. **"Next.js package not found"는 직역하면 안 됨**
   `node_modules/next`가 없다는 뜻이 아니다. Turbopack이 resolve context를 만들다 실패했다는 내부 표현이 외부로 그렇게 노출된 것. `npm install`을 다시 해도 해결되지 않는다.

2. **FATAL이 뜨는데 200은 왜 계속 오는지**
   Turbopack task 하나가 panic해도 dev 서버 프로세스는 살아있다. 페이지 응답은 이전 캐시 결과이고, 새 변경은 반영되지 않는다. "동작하는 것처럼 보이지만 실제로는 stale"이라는 위험한 상태.

3. **중복 dev 서버라고 오해하기 쉬움**
   반복 FATAL을 보면 "서버 여러 개가 충돌하나?"를 먼저 의심하게 되는데, 단일 프로세스 내부의 task 재시도 루프가 원인인 경우가 많다. `ps aux | grep next`를 먼저 확인.

4. **`npm run build` → `npm run dev`의 순서가 함정**
   개별적으로는 문제없는 커맨드 두 개가 순차 실행될 때 `.next` 공유 때문에 지뢰가 된다. 팀에서 스크립트로 묶어 쓰고 있다면 그 사이에 `rm -rf .next`가 들어가 있어야 안전.

### 주의할 부분

- `.next`, `.turbo`, `node_modules/.cache` 모두 gitignore 대상이므로 **로컬 삭제는 안전**. 다른 팀원이나 CI에 영향 없음.
- `rm -rf node_modules/next` 같은 실제 패키지 폴더 삭제는 하면 안 됨. 에러 메시지만 보고 진짜로 지우면 `npm install` 왕복 시간이 늘어날 뿐 해결되지 않는다.
- Capacitor live reload를 쓰고 있다면 기기/시뮬레이터도 재연결해야 HMR이 다시 붙는다.

---

## 참고 자료

이번 학습은 주로 panic log 내부 에러 체인을 직접 읽어 추론했다.

- panic log 경로: `/var/folders/32/.../T/next-panic-*.log` (macOS 임시 경로, 세션마다 해시 달라짐)
- Next.js 공식 문서: <https://nextjs.org/docs>
- Turbopack 공식 문서: <https://nextjs.org/docs/app/api-reference/turbopack>
- `turbo-tasks` (Salsa 스타일 incremental 프레임워크): <https://turbo.build/pack/docs>
- `.next` 폴더 구조 참고: Next.js 레포 `packages/next/src/server/lib/app-dir-module.ts` 등
