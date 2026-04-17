# 환경변수 누락 시 silent fallback + .env.example 유실 (AI 구현 이슈 2건)

## 발견 환경
- 날짜: 2026-04-17 / 관련 프로젝트: how_many / AI 도구: Claude Code `implement` 에이전트
- 관련 태스크: HM-23 "개발 URL 분리" Task 002, 003
- 리뷰 주체: Claude Code `review` 에이전트 (별도 세션)

---

## AI 출력물 상태

### 프롬프트 맥락
- 요청: Capacitor `server.url`을 `process.env.CAPACITOR_SERVER_URL` 기반으로 분기, `build:android:dev`/`build:android:prod` 스크립트 분리, `.env.example` 생성, `CLAUDE.md § 배포 설정` 업데이트
- 제약: fallback은 프로덕션 URL (env 누락 시 안전한 쪽으로 기울임)

### AI가 생성한 초기 구현 (문제 있는 상태)
```json
// package.json
"build:android:dev": "export NEXT_STATIC_EXPORT=true && next build && npx cap sync android",
"build:android:prod": "export NEXT_STATIC_EXPORT=true CAPACITOR_SERVER_URL=https://how-many-mauve.vercel.app && next build && npx cap sync android",
```

```
// .env.example 파일 생성 (O)
# 하지만 .gitignore의 .env* 패턴이 이 파일을 무시함 → 커밋 불가
```

### AI가 놓친 부분
1. **`.env.example` 파일 자체는 정확히 생성**했으나, 프로젝트의 `.gitignore`를 확인하지 않아 **파일이 버전 관리에서 제외**되는 상황 미인지.
2. **`build:android:dev`에 env 가드 없음**: `CAPACITOR_SERVER_URL` 누락 시에도 빌드 성공. `capacitor.config.ts`의 fallback 로직(= prod URL)이 조용히 적용됨.

---

## 발견한 문제

### 카테고리: 로직 / 운영 안정성

### 문제 1 — `.env.example` gitignore 충돌 (HIGH)
- 프로젝트 `.gitignore`에 `.env*` 패턴이 있어 `.env.example`까지 매칭됨.
- `git check-ignore -v .env.example` 실행 시 매칭 확인됨.
- **결과**: 파일을 생성해도 팀원(기획자 포함)이 clone 시 받을 수 없음. 문서화 의도 소실.

### 문제 2 — dev 빌드 silent fallback (HIGH)
- 시나리오: 개발자가 `npm run build:android:dev`를 env 없이 실행 → 빌드 "성공" → **AAB 안에 prod URL이 박힘** → 내부 테스트 트랙에 업로드 시 QA 환경이 사실상 프로덕션.
- `capacitor.config.ts`의 `console.log("[Capacitor] server.url = ${PROD_URL}")` 경고는 `next build`의 수백 줄 로그에 묻힘.
- **기획 원래 의도와 정확히 반대 결과**를 만드는 함정.

---

## 수정 내용

### 수정 1: `.gitignore`에 예외 추가
```diff
 # env files (can opt-in for committing if needed)
 .env*
+!.env.example
```
- `git check-ignore -v .env.example` → `.gitignore:35:!.env.example .env.example` (negation 규칙 적용 확인)

### 수정 2: `package.json`에 env 가드 + alias 정리
```diff
-"build:android": "export NEXT_STATIC_EXPORT=true CAPACITOR_SERVER_URL=https://how-many-mauve.vercel.app && next build && npx cap sync android",
-"build:android:dev": "export NEXT_STATIC_EXPORT=true && next build && npx cap sync android",
+"build:android": "npm run build:android:prod",
+"build:android:dev": "if [ -z \"$CAPACITOR_SERVER_URL\" ]; then echo 'ERROR: CAPACITOR_SERVER_URL 환경변수 필수. 예: CAPACITOR_SERVER_URL=https://how-many-git-develop-xxx.vercel.app npm run build:android:dev' && exit 1; fi && export NEXT_STATIC_EXPORT=true && next build && npx cap sync android",
```
- 검증: `npm run build:android:dev` 환경변수 없이 실행 시 `exit 1` 확인. 명확한 에러 메시지 출력.
- 부수 효과: `build:android`가 `build:android:prod`의 alias가 되어 DRY 위반 제거.

---

## 교훈

### AI 출력물 검증 시 주의할 점

1. **파일 생성은 맥락(context)에서 확인하라**
   - AI가 `.env.example`을 "정확히" 만들어도, `.gitignore`와의 상호작용을 고려하지 않으면 실질적으로 무효.
   - 검증: 새 파일을 만들 땐 **반드시 `git status`와 `git check-ignore`로 추적 여부 확인**.

2. **"Silent fallback"을 경계하라**
   - AI는 프롬프트의 "fallback은 prod URL"을 충실히 구현하나, **fallback이 적용된 사실을 사용자가 눈치채지 못할 가능성**은 고려하지 않음.
   - 안전 fallback과 "silent 실패"는 종이 한 장 차이. **빌드 시점에 env 유무가 영향을 주는 경우, 가드를 명시적으로 넣어야 한다**.
   - 원칙: fallback은 **런타임 안전망**으로만 쓰고, **빌드 타임 분기는 명시적 에러로 실패**시키는 게 낫다.

3. **프롬프트의 "fallback" 요구와 "명시적 실패" 요구는 충돌할 수 있다**
   - 이번 기획은 "env 누락 시 prod URL로 안전 기울임"을 명시했으나, 실제로는 prod/dev **스크립트별로 다른 전략**이 필요했음:
     - `build:android:prod`: env 주입 고정 (fallback 불필요)
     - `build:android:dev`: env 강제 (fallback이 오히려 위험)
   - AI는 양쪽을 동일하게 처리 → 결과적으로 dev에만 위험 발생.

### 유사 패턴 방지법

- **체크리스트**: 환경별 빌드 스크립트를 만들 때 각 스크립트에 "이 스크립트에서 env 누락 시 어떻게 돼야 하나?"를 명시적으로 질문.
- **패턴**: 프로덕션 영향이 큰 빌드일수록 "fail fast"가 원칙. Silent fallback은 디버깅 빌드에만.
- **리뷰 포인트**: AI가 생성한 빌드 스크립트 리뷰 시 항상 확인할 3가지:
  1. 필수 env 누락 시 동작 (exit code)
  2. fallback 로직이 **어디서** 적용되는지 (빌드 타임 vs 런타임)
  3. 생성한 설정 파일이 **배포·공유 가능한 상태**인지 (gitignore, 권한)

### 프로세스 교훈

- **리뷰 에이전트를 별도 세션으로 돌린 것이 유효**했음. 같은 맥락에 머무르면 `.gitignore`를 또 놓쳤을 가능성.
- **실제 검증 커맨드 실행**(`git check-ignore`, 실제 `npm run` 후 exit code 확인)이 핵심. 리뷰 의견만 읽고 넘어갔다면 "가드 잘 들어갔겠지"로 끝났을 것.

---

## 참조
- 리뷰 원본: `.claude/plans/review.md`
- 구현 컨텍스트: `.claude/context/dev-url-separation/implementation.md`
- 기획: `.claude/plans/generic-cooking-crayon.md`
- Linear 이슈: HM-23
