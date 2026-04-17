# Review: 개발 URL 분리 (HM-23)

## 변경 범위
- 변경 파일: `capacitor.config.ts`, `package.json`, `.env.example`(신규), `CLAUDE.md`
- 관련 기능: Android Capacitor 빌드의 dev/prod URL 분리

## CRITICAL

없음

## HIGH

### [HIGH] `.env.example`이 `.gitignore`에 의해 무시됨
- 파일: `.gitignore:34` — 패턴 `.env*`
- 문제: `.env.example`이 `.env*` glob에 매칭되어 git tracked 되지 않는다. `git check-ignore -v .env.example` → `.gitignore:34:.env*`로 확인됨. 다른 개발자가 clone해도 이 파일이 없어 `CAPACITOR_SERVER_URL` 가이드를 볼 수 없다.
- 수정: `.gitignore`에 `!.env.example` 예외 추가, 또는 `.env.example` 대신 `CLAUDE.md`에만 문서화 (이미 CLAUDE.md에 충분한 정보가 있으므로 `.env.example` 제거도 대안).

### [HIGH] `build:android:dev` env 누락 시 silent fallback
- 파일: `package.json:14`
- 문제: `npm run build:android:dev`를 `CAPACITOR_SERVER_URL` 없이 실행하면 **에러 없이 prod URL로 빌드**된다. 개발자가 "dev 빌드 완료"로 착각하고 내부 테스트 트랙에 prod URL AAB를 업로드할 수 있다. `capacitor.config.ts`의 `console.log` 경고는 `next build` 출력에 묻혀 놓치기 쉽다.
- 수정: `build:android:dev` 스크립트 앞에 `test -n "$CAPACITOR_SERVER_URL" || (echo "ERROR: CAPACITOR_SERVER_URL 필수" && exit 1)` 가드 추가를 권장. 또는 `capacitor.config.ts`에서 `CAPACITOR_SERVER_URL`이 `build:android:dev` 컨텍스트일 때 throw하는 방식.

## MEDIUM

### [MEDIUM] `build:android` 스크립트가 `build:android:prod`의 복사본
- 파일: `package.json:13,15`
- 문제: plan에서는 `build:android`를 `"npm run build:android:prod"` alias로 정의하기로 했으나, 실제 구현은 동일 명령어를 복사-붙여넣기했다. 향후 prod URL 변경 시 2곳을 수정해야 한다.
- 수정: `"build:android": "npm run build:android:prod"` 로 변경하면 single source of truth 유지.

### [MEDIUM] CLAUDE.md에 Linear 섹션 대량 추가 (100줄+)
- 파일: `CLAUDE.md:173-256`
- 문제: "개발 URL 분리" 변경과 무관한 Linear 이슈 트래킹 섹션(팀 구성, 상태 플로우, 라벨 체계, 동기화 메커니즘 등 ~80줄)이 함께 추가되었다. 이 내용은 이미 `CLAUDE.md`(프로젝트 instruction) 상위 레이어에 동일하게 존재하여 **중복**이다. 이 PR의 변경 범위를 벗어남.
- 수정: Linear 관련 섹션은 별도 커밋으로 분리하거나, 상위 instruction과 중복이므로 제거 검토.

## LOW / 제안

### [LOW] `export VAR1=val1 VAR2=val2` 패턴은 Windows 비호환
- 파일: `package.json:13-15`
- 문제: `export`는 POSIX 전용. Windows CMD/PowerShell에서 직접 실행 불가. 현재 팀이 macOS만 사용하고 `engines.node`에 OS 제약이 없으나, 향후 `cross-env` 패키지 도입을 고려할 수 있다.

### [LOW] `capacitor.config.ts`의 `console.log`가 빌드 때마다 출력
- 파일: `capacitor.config.ts:10-13`
- 문제: `npx cap sync` 실행 시마다 2줄의 로그가 출력된다. 의도된 동작이지만, 빌드 로그가 길어지면 노이즈가 될 수 있다. 현재는 유용하므로 유지해도 무방.

## 종합 의견

| 심각도 | 건수 | 상태 |
|--------|------|------|
| CRITICAL | 0 | pass |
| HIGH | 2 | action required |
| MEDIUM | 2 | info |
| LOW | 2 | note |

**Verdict: Warning**

핵심 설계(env 기반 분기, prod fallback)는 적절하다. 필수 수정 2건:
1. `.env.example`을 `.gitignore`에서 예외 처리하거나 제거
2. `build:android:dev`에 env 미설정 가드 추가 (silent prod fallback 방지)

선택 수정: `build:android`를 `npm run build:android:prod` alias로 변경하여 DRY 유지.

<!-- BLOG_TRIGGER: ai-review | CRITICAL 0건, HIGH 2건 | build:android:dev가 env 누락 시 silent하게 prod URL로 빌드되는 문제 -->
