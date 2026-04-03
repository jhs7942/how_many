# Google Play Console 제출 — 수동 작업 체크리스트

## 사전 준비 (Claude가 완료)
- [x] 릴리스 키스토어 생성 (`android/howmany-release.keystore`)
- [x] `build.gradle` signingConfigs 설정
- [x] 개인정보처리방침 페이지 (`/privacy`)
- [x] AAB 빌드 (`android/app/build/outputs/bundle/release/app-release.aab`, 3.5MB)

---

## 1단계: 키스토어 백업 (즉시)

> ⚠️ 분실 시 앱 업데이트 불가 — 가장 먼저 해야 할 일

- [ ] `android/howmany-release.keystore` → 외장 드라이브 or 클라우드 백업
- [ ] `android/key.properties` (비밀번호 포함) → 같이 백업 (보안 저장소 권장)

---

## 2단계: Vercel 배포

> 개인정보처리방침 URL이 외부에서 접근 가능해야 Play Console에 등록 가능

- [x] git push 후 Vercel 자동 배포 확인
- [x] https://how-many-mauve.vercel.app/privacy 접근 확인
- [x] 개인정보처리방침 내 이메일 확인 (`saver7942@gmail.com` 적용 완료)

---

## 3단계: 스토어 등록 자료 준비

### 텍스트
- [ ] **앱 이름**: 몇명이니 (30자 이내)
- [ ] **짧은 설명**: 80자 이내 한 줄 설명 작성
- [ ] **전체 설명**: 앱 기능 상세 설명 (4000자 이내)

### 이미지
- [ ] **아이콘**: 512×512 PNG (현재 앱 아이콘을 고해상도로 준비)
- [ ] **그래픽 이미지**: 1024×500 PNG (스토어 상단 배너)
- [ ] **스크린샷**: 휴대전화 최소 2장 (권장 6.7인치 기준, 16:9 또는 9:16)
  - 홈 화면
  - 혼자 결정 플로우 (돌림판)
  - 같이 결정 플로우 (투표)
  - 결과 화면

---

## 4단계: Google Play Console 설정

> 계정이 없다면 https://play.google.com/console 에서 $25 결제 후 등록

- [ ] 새 앱 생성
  - 앱 이름: 몇명이니
  - 기본 언어: 한국어 (ko)
  - 앱 또는 게임: 앱
  - 유/무료: 무료

---

## 5단계: 스토어 등록 정보 입력 (Play Console)

- [ ] 앱 이름, 짧은 설명, 전체 설명 입력
- [ ] 아이콘, 그래픽 이미지, 스크린샷 업로드
- [ ] 카테고리 선택 (도구 또는 엔터테인먼트)
- [ ] 개인정보처리방침 URL 입력 → `https://how-many-mauve.vercel.app/privacy`

---

## 6단계: 앱 콘텐츠 설정 (Play Console)

- [ ] **IARC 콘텐츠 등급 설문** 완료 → 전체이용가 예상
- [ ] **타겟 연령대** 선언 (만 13세 이상 권장)
- [ ] **광고 포함 여부** → 없음 선택
- [ ] **데이터 안전 섹션** 작성:
  | 항목 | 설정 |
  |------|------|
  | 데이터 암호화 여부 | 예 (전송 중 암호화) |
  | 삭제 요청 가능 여부 | 예 |
  | 수집 데이터 | 앱 활동 (투표, 결과) |
  | 개인 식별 정보 | 없음 (닉네임은 익명) |

---

## 7단계: AAB 업로드 및 심사 제출

- [ ] Play Console → 프로덕션 → 새 버전 만들기
- [ ] `android/app/build/outputs/bundle/release/app-release.aab` 업로드
- [ ] **Play 앱 서명** 활성화 (첫 업로드 시 자동 안내 — 권장)
- [ ] 버전 노트 작성 (첫 번째 버전)
- [ ] 심사 제출

---

## 참고

- **심사 기간**: 보통 1~3일 (첫 앱은 최대 7일 소요될 수 있음)
- **키스토어 비밀번호**: `android/key.properties` 파일 참조 (외부 비공개)
- **다음 업데이트 시**: `android/app/build.gradle`의 `versionCode`를 반드시 1씩 증가
