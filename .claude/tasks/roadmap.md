# Taskboard: 개발 URL 분리 (develop 브랜치 + dev 빌드 파이프라인)

생성일: 2026-04-17
기반: `.claude/plans/generic-cooking-crayon.md`
Linear 이슈: HM-23

## 진행 현황
완료: 0/5 | 현재: Task 001

### Phase 0 (사전 완료 항목)
- [x] Linear 이슈 HM-23 생성 완료 (2026-04-17)
- [x] progress.md current_issue 동기화 완료

## 태스크 목록

### Task 001: develop 브랜치 생성 + Vercel preview URL 확보 [CURRENT]
- 상태: TODO
- 예상 규모: Small (1 세션)
- 의존성: 없음
- 완료 조건:
  - [ ] `git checkout -b develop` 로컬 생성
  - [ ] `git push -u origin develop`로 원격 푸시
  - [ ] Vercel 대시보드에서 자동 할당된 preview URL 확인 (`how-many-git-develop-*.vercel.app` 형태)
  - [ ] Vercel 프로젝트 설정 "Git" 탭에서 develop 브랜치 자동 배포 활성 확인
  - [ ] preview URL 접속하여 200 응답 및 정상 렌더링 확인
- 파일 범위: git 원격만 (파일 수정 없음)
- 검증: curl 또는 브라우저로 preview URL 접속
- 산출물: 확정된 dev URL (Task 002에 전달)

---

### Task 002: Capacitor config 환경변수 분기 + 빌드 스크립트 분리
- 상태: TODO
- 예상 규모: Small (1 세션)
- 의존성: Task 001은 **선행 권장**이지만 필수 아님 (dev URL은 빌드 시점 shell에서 주입)
- 완료 조건:
  - [ ] `capacitor.config.ts`에서 `process.env.CAPACITOR_SERVER_URL` 참조로 변경
  - [ ] fallback을 프로덕션 URL로 안전 기울임
  - [ ] `package.json`에 `build:android:dev` 스크립트 추가 (env는 shell 주입)
  - [ ] `package.json`에 `build:android:prod` 스크립트 추가 (prod URL 고정)
  - [ ] 기존 `build:android`를 `build:android:prod` alias로 유지
  - [ ] `.env.example` 생성 또는 업데이트 (`CAPACITOR_SERVER_URL` 참조 예시)
  - [ ] `npm run build:android:prod` 빌드 성공 (에러 없이 완료, prod URL 반영 확인)
  - [ ] `CAPACITOR_SERVER_URL=https://test.example.com npm run build:android:dev` 빌드 후 `android/app/src/main/assets/capacitor.config.json`의 `server.url`이 `https://test.example.com`으로 반영되는지 확인
- 파일 범위:
  - `capacitor.config.ts`
  - `package.json`
  - `.env.example` (신규)
- 검증:
  - 빌드 후 `android/app/src/main/assets/capacitor.config.json`의 `server.url`이 주입된 env 값으로 반영되는지 확인 (핵심 체크포인트)
  - 환경변수 누락 시 fallback이 prod URL인지 확인

---

### Task 003: 문서 업데이트 (CLAUDE.md 배포 설정 섹션)
- 상태: TODO
- 예상 규모: Small (1 세션, Task 002와 같은 세션에서 처리 가능)
- 의존성: Task 002
- 완료 조건:
  - [ ] `CLAUDE.md § 배포 설정 > Android (Capacitor)`에 `build:android:dev` / `build:android:prod` 커맨드 추가
  - [ ] "내부 테스트 트랙 = dev URL, 프로덕션 트랙 = prod URL" 정책 명시
  - [ ] versionCode 전역 단조 증가 규칙 추가
  - [ ] 브랜치 전략(feature → develop → main) 명시
- 파일 범위: `CLAUDE.md`
- 검증: 새 팀원이 문서만 읽고 dev/prod 빌드를 구분해 수행 가능한지 읽기 테스트

---

### Task 004: dev AAB 빌드 및 Play 내부 테스트 트랙 업로드
- 상태: TODO
- 예상 규모: Medium (1~2 세션, Play Console 절차 포함)
- 의존성: Task 002, Task 003
- 완료 조건:
  - [ ] `android/app/build.gradle`의 `versionCode`를 10으로 증가 (현재 9)
  - [ ] `npm run build:android:dev` 성공
  - [ ] `cd android && JAVA_HOME=... ./gradlew bundleRelease` 성공
  - [ ] `android/app/build/outputs/bundle/release/app-release.aab` 생성 확인
  - [ ] Play Console MCP `upload_artifact` 또는 수동 업로드로 내부 테스트 트랙 등록
  - [ ] 기획자(문은서) 테스터 등록 상태 확인
  - [ ] 테스트 기기에서 내부 테스트 앱 설치 후 dev URL 로드 확인
- 파일 범위:
  - `android/app/build.gradle` (versionCode만)
  - AAB 산출물 (gitignore)
- 검증:
  - WebView 상단 URL 또는 콘솔 로그로 dev URL 로드 확인
  - 프로덕션 앱(동일 applicationId)이 dev 앱으로 업그레이드되는 동작 숙지

---

### Task 005: End-to-End 검증 + Linear HM-23 Done 처리
- 상태: TODO
- 예상 규모: Small (1 세션)
- 의존성: Task 004
- 완료 조건:
  - [ ] develop 브랜치에 가시적 변경(예: 홈 화면 copy 변경) 커밋·푸시
  - [ ] Vercel preview URL에서 변경 반영 확인
  - [ ] `main` 브랜치의 prod URL은 변경 없음 확인
  - [ ] 내부 테스트 기기에서 dev URL 변경 반영 재확인
  - [ ] `develop` → `main` 머지 흐름 1회 리허설 (실제 prod 반영은 별도 릴리즈 시점)
  - [ ] Linear HM-23 상태 `In Review` → `Done` 전이 (기획자 승인 후)
  - [ ] `.claude/plans/progress.md § Linear`의 `current_issue_id`를 `null`로 리셋
- 파일 범위:
  - 테스트용 임시 커밋 (제거 또는 유지 결정)
  - `.claude/plans/progress.md` (current_issue 리셋)
- 검증:
  - 두 URL 동시 접속해 렌더링 차이 비교
  - Linear 이슈 상태 및 코멘트 기록 확인

---

## 전체 작업 경로 예시

```
Task 001 ─▶ Task 002 ─▶ Task 003 ─▶ Task 004 ─▶ Task 005
  (git)     (config)    (docs)      (AAB)       (검증·Done)
```

## 미포함 범위 (이번 작업 외)

plan.md § "미포함 범위"와 동일:
- Android build flavor (`.dev` suffix)
- Supabase dev 프로젝트 분리
- Firebase App Distribution
- GitHub Actions CI/CD
- 커스텀 도메인

## 참조
- 상세 plan: `.claude/plans/generic-cooking-crayon.md`
- 배경지식: `.claude/study/2026-04-17/dev-prod-env-separation-plan.md`
- Linear 이슈: HM-23
