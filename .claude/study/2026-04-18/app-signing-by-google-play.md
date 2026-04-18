# App Signing by Google Play

## 학습 환경
- 날짜: 2026-04-18 / 관련 프로젝트: 몇명이니 (how_many) / 기술·버전: Android AAB, Google Play Console, Capacitor 6

## 배경

Linear HM-15 이슈("[Infra] 릴리즈 키스토어 백업")를 처리하면서 "키스토어를 Linear에 올리면 안 되나?" 논의가 나왔다. 키 유출·분실 리스크를 정확히 판단하려면 **현재 몇명이니 앱이 어떤 서명 구조를 쓰고 있는지**부터 알아야 했다. 2021년 8월 이후 Play Console에 등록된 신규 앱은 App Signing by Google Play가 필수이므로, 이 서비스의 동작 원리와 키 종류별 역할을 정리해둔다.

## 핵심 개념

### App Signing by Google Play란

Google이 앱의 최종 서명 키(**앱 서명 키**)를 대신 보관·사용해주는 서비스. 개발자는 AAB를 **업로드 키**로 서명해서 Play Console에 올리고, Google이 이를 검증한 뒤 Google 보관 중인 앱 서명 키로 **재서명**하여 사용자에게 배포한다.

- 도입: 2017년
- 의무화: 2021년 8월 (신규 앱부터 필수)
- 내부 저장소: Google Cloud KMS (HSM 기반 하드웨어 보안)

### 동작 구조

```
[전통 방식 - 2021년 이전]
개발자 키스토어 → APK 직접 서명 → Play Store 업로드 → 사용자 설치
      ↑
  분실하면 끝 (업데이트 불가, 앱 재등록만 가능)

[App Signing by Google Play]
업로드 키 (개발자 보관)              앱 서명 키 (Google 보관, Google Cloud KMS)
         │                                       │
         ▼                                       ▼
   AAB 서명 → Play Console 업로드 → Google이 재서명 → 사용자 설치
                                         │
                                     최적화된 APK 여러 개 생성
                                     (화면 밀도·ABI·언어별 Split APKs)
```

### 두 가지 키

| 키 | 보관 주체 | 역할 | 분실 시 대응 |
|---|---|---|---|
| **업로드 키** (upload key) | 개발자 | Play Console에 AAB 올릴 때 인증용 | Google 지원팀에 리셋 요청 → **복구 가능** |
| **앱 서명 키** (app signing key) | Google | 사용자 디바이스가 설치 시 검증하는 최종 서명 | Google이 영구 보관 → 개발자가 분실할 일 없음 |

업로드 키와 앱 서명 키는 **다른 키**이다. 업로드 키는 "이 AAB를 Play Console이 받을 자격이 있는가"를, 앱 서명 키는 "사용자 기기에 설치될 APK가 진짜인가"를 증명한다.

### 왜 도입됐나

1. **키 분실 방지**: 2010년대 수많은 소규모 개발자가 키스토어 파일을 잃고 앱 업데이트가 영구 불가능해지는 사고가 반복됐다. 앱 재등록은 기존 사용자 데이터·리뷰·다운로드 수·순위를 모두 날리므로 사실상 사업 재시작.
2. **APK 최적화 (Android App Bundle)**: Google이 서명 권한을 가져야 기기별 Split APK를 동적으로 생성·재서명할 수 있다. 사용자는 자기 기기에 필요한 리소스만 다운받게 되어 설치 용량이 작아진다.
3. **보안 강화**: 개발자 노트북보다 Google Cloud KMS + HSM이 훨씬 안전하다. 내부자 접근도 제한된다.

### 앱 등록 시나리오 3가지

| 시나리오 | 업로드 키 | 앱 서명 키 | 로컬 키스토어(`howmany-release.keystore`)의 의미 | 분실 리스크 |
|---|---|---|---|---|
| **A. Google에 원본 키 업로드** | Google이 관리 | Google 보관 | 업로드 키 = 앱 서명 키 (동일) | 리셋 요청 가능 → **낮음** |
| **B. 별도 업로드 키 생성** | 개발자 보관 | Google 보관 | 업로드 키 (앱 서명 키는 Google에) | 리셋 요청 가능 → **매우 낮음** |
| **C. App Signing 비활성화 (구형/opt-out)** | — | 개발자 보관 | 앱 서명 키 그 자체 | 분실 = 앱 업데이트 영구 불가 → **매우 높음** |

2021년 8월 이후 신규 앱은 C를 선택할 수 없다. 따라서 몇명이니(2026년 프로젝트)는 거의 확실히 **A 또는 B 시나리오**.

### 몇명이니 실제 확인 결과 (2026-04-18)

**B 시나리오 확정.** Play Console → 앱 서명 페이지에서 "앱 서명 키 인증서"와 "업로드 키 인증서"가 별도 섹션으로 표시되며 SHA-1 지문이 서로 다름.

| 키 종류 | SHA-1 지문 | 보관 주체 |
|---|---|---|
| 앱 서명 키 | `38:3C:46:46:21:5D:E0:2F:3E:36:AA:B7:42:FC:F1:7D:2A:E1:B6:19` | Google Cloud KMS |
| 업로드 키 (`howmany-release.keystore`) | `41:12:99:70:DC:37:EF:CC:E5:6A:E2:C7:FD:B4:89:18:B9:06:58:74` | 로컬 |

**리스크 평가**:
- 로컬 keystore 분실 → "업로드 키 재설정 요청"으로 복구 가능 (2~3일 소요)
- 로컬 keystore 유출 → 업로드 키 재설정하면 유출본 무력화. 사용자 기기는 영향 없음
- 앱 업데이트 영구 불가 사태는 **발생 불가능**

**Linear HM-15 재평가**: 당초 High priority로 등록됐으나 B 시나리오 확정 후 Medium/Low 수준으로 하향 가능.

## 실제 적용

### 확인 방법

Play Console → `몇명이니` 앱 → **설정** → **앱 서명** 메뉴:

- **"Play 앱 서명 사용 중"** 표시 있음 → A 또는 B
- SHA-1 지문이 **1개**만 보임 → A (업로드 키 = 앱 서명 키)
- SHA-1 지문이 **2개** 보임 (업로드 키 + 앱 서명 키 각각) → B (권장 구조)

### B 시나리오에서 업로드 키 분실 시 복구 절차

1. Play Console → 설정 → 앱 서명 → "업로드 키 재설정 요청"
2. 새 업로드 키 생성 (keytool로 새 keystore 만듦)
3. 새 키의 PEM 공개키를 Google에 업로드
4. Google 승인 후 2~3일 내 전환 완료
5. 전환 후부터는 새 업로드 키로 AAB 서명

→ 앱 서명 키는 그대로 유지되므로 **사용자 기기에서는 아무 변화 없이 업데이트 수신**.

### 몇명이니 키스토어 파일 구조

```
android/
  howmany-release.keystore    # 업로드 키 (B 시나리오 확정 — 2026-04-18)
                              # SHA-1: 41:12:99:70:DC:37:EF:CC:E5:6A:E2:C7:FD:B4:89:18:B9:06:58:74
  key.properties              # 키 비밀번호 (storePassword, keyAlias, keyPassword)
```

`key.properties`는 git에서 제외됨(`.gitignore`). 둘 다 분실해도 Google에 "업로드 키 재설정 요청"으로 복구 가능 (앱 서명 키는 Google Cloud KMS에 영구 보관).

**Play Console 앱 서명 페이지 직링크**:
`https://play.google.com/console/u/0/developers/7962901105868160912/app/4974062925009946290/keymanagement`

### 키 백업 권장 방식

1. **1Password / Bitwarden**: keystore 파일 + key.properties를 "Secure Note"에 첨부. E2E 암호화 + 2FA
2. **로컬 암호화 + 다중 클라우드**: `gpg -c howmany-release.keystore`로 암호화한 뒤 iCloud + Google Drive 양쪽 업로드. 패스프레이즈는 1Password에 별도 저장
3. **절대 금지**: Linear 이슈 첨부, Slack 메시지, 공유 Google Drive(멤버 권한), git 저장소

## 주의사항

### 업로드 키와 앱 서명 키 혼동 금지

- "키스토어 잃어버리면 앱 업데이트 못 한다"는 오래된 정보. 2021년 이후는 업로드 키 분실 ≠ 앱 서명 키 분실.
- 디버그 빌드용 `debug.keystore`와 릴리즈용 `howmany-release.keystore`는 완전히 별개. 디버그 키로 서명된 AAB는 Play Console에 올릴 수 없다.

### App Signing 활성화는 되돌릴 수 없음

한번 App Signing by Google Play를 활성화하면 opt-out 불가. Google이 앱 서명 키를 보관하게 되고 개발자는 다시는 원본 앱 서명 키를 다룰 수 없다.

### Capacitor AAB 빌드 체인

몇명이니의 AAB 빌드 과정:
```
npm run build:android:prod         # Next.js 빌드 + Capacitor sync (prod URL)
cd android && ./gradlew bundleRelease
→ android/app/build/outputs/bundle/release/app-release.aab (업로드 키로 서명됨)
→ Play Console 업로드
→ Google이 앱 서명 키로 재서명
→ 사용자에게 Split APK 배포
```

### versionCode 규칙

dev/prod 모두 `com.howmany.app` 같은 `applicationId`를 쓰므로 versionCode는 트랙 통합 전역 단조 증가해야 한다 (Play Console이 같은 앱의 모든 트랙에서 versionCode 유일성 강제). App Signing과는 별개의 제약이지만 같이 알아두면 좋다.

### 오픈소스 프로젝트에서의 함정

GitHub 공개 저장소에 실수로 `key.properties`를 커밋한 사례가 많다. `key.properties`만 유출돼도 공격자가 로컬에서 키스토어를 탈취하기 쉬워진다. `.gitignore` 확인 필수.

## 참고 자료

- [Android Developers — Use Play App Signing](https://developer.android.com/studio/publish/app-signing)
- [Google Play Console Help — App signing by Google Play](https://support.google.com/googleplay/android-developer/answer/9842756)
- [Android Developers — Sign your app](https://developer.android.com/studio/publish/app-signing#sign-apk)
- [Medium — Why Google Play App Signing is actually useful (Paul Ruiz, 2019)](https://proandroiddev.com/google-play-app-signing-bcbc75c5c81)
- 프로젝트 내부: `CLAUDE.md` § 배포 설정 > Android (Capacitor), `.claude/plans/progress.md § Linear` (HM-15)
