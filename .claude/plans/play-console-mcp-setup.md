# Google Play Console MCP 자동 배포 파이프라인 구축 계획

## 목표
Claude Code 세션에서 AAB 빌드 → Internal 트랙 업로드 → (검증 후) Production staged rollout 까지 자동화한다.

## 배포 전략: A안
- **테스트**: Internal testing 트랙 (심사 없음, 수분 내 설치 가능)
- **프로덕션**: Internal → Production **10% → 50% → 100%** 단계적 롤아웃
- **검증 게이트**: 10% 롤아웃 후 24~48시간 Android Vitals(크래시율·ANR율) 확인 후 승격

## 확정 사항
- **SA JSON 경로**: `~/.config/gcloud/howmany-play-sa.json`
- **`.mcp.json`**: git 커밋
- **릴리즈 노트**: Claude가 커밋 로그 기반으로 한국어 사용자 친화 문구 생성 → 업로드 전 확인
- **versionCode**: `build.gradle`의 현재 값 + 1 (Claude가 배포 시 파일 직접 수정)
- **versionName**: 수동 관리 (의미 있는 변경 시만 올림)

---

## 작업 분할

### 🙋 사용자가 직접 해야 하는 작업 (Claude 불가)
| # | 작업 | 이유 | 예상 시간 |
|---|---|---|---|
| 1 | Google Cloud Console에서 프로젝트 생성 또는 기존 프로젝트 선택 | GCP 로그인 필요 | 5분 |
| 2 | Google Play Android Developer API 활성화 | GCP 콘솔 UI | 2분 |
| 3 | Google Play Developer Reporting API 활성화 | GCP 콘솔 UI | 2분 |
| 4 | Service Account 생성 + JSON 키 다운로드 | GCP 콘솔 UI | 5분 |
| 5 | Play Console에서 해당 Service Account 이메일 초대 + 권한 부여 | Play Console UI | 5분 |
| 6 | JSON 키를 `~/.config/gcloud/howmany-play-sa.json`에 저장 | 키 파일 관리 | 1분 |
| 7 | `uv` 설치: `curl -LsSf https://astral.sh/uv/install.sh \| sh` | MCP 실행 환경 | 1분 |

### 🤖 Claude가 처리할 작업
| # | 작업 | 파일 | 설명 |
|---|---|---|---|
| A | `uv` 설치 확인 | - | 설치 여부 체크 + 안내 |
| B | MCP 서버 등록 | `.mcp.json` (신규) | `uvx google-play-mcp` 실행 설정 |
| C | versionCode 증가 방식 변경 | `android/app/build.gradle` | 배포 시 Claude가 현재 값 +1로 직접 수정 (Gradle 동적 로직 X) |
| D | versionName 현행 유지 확인 | `android/app/build.gradle` | 수동 관리, 변경 없음 |
| E | SA 키 유출 방지 | `.gitignore` | `*-sa.json`, `*service-account*.json` 패턴 추가 |
| F | 릴리즈 노트 생성 플로우 | 대화형 | 배포 시 커밋 로그 → Claude 한국어 변환 → 확인 → MCP 전달 |

### ❌ 제거된 작업 (보완 반영)
| 작업 | 제거 이유 |
|---|---|
| `scripts/deploy-android.sh` | Claude 세션에서 직접 실행하므로 별도 스크립트 불필요 |
| `docs/deploy-android.md` | 운영 가이드는 이 plan.md + CLAUDE.md로 충분 |
| Gradle 동적 versionCode 로직 | build.gradle 직접 수정 방식으로 변경 (단순·안전) |

---

## 파일 변경 명세

### B. `.mcp.json` (신규)
```json
{
  "mcpServers": {
    "google-play-console": {
      "command": "uvx",
      "args": ["google-play-mcp"],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/Users/jeonghyeonseung/.config/gcloud/howmany-play-sa.json"
      }
    }
  }
}
```
- 절대경로 사용 (`${HOME}` 확장 미보장 이슈 해소)

### C. `android/app/build.gradle` versionCode
변경 없음 (현재 `versionCode 8` 유지). 배포 시마다 Claude가 Edit 도구로 +1 수정:
```
배포 시: versionCode 8 → versionCode 9
다음 배포: versionCode 9 → versionCode 10
```
- Gradle 동적 로직 X → 파일에 명시된 값이 곧 진실
- rebase·브랜치 전환에 무관
- Play Console에 업로드된 마지막 버전과 항상 동기

### E. `.gitignore` 추가 패턴
```gitignore
# Google Cloud Service Account 키 (유출 방지)
*-sa.json
*service-account*.json
```

### F. 릴리즈 노트 생성 플로우 (대화형)
배포 명령 시 Claude가 자동 수행:
1. `git log --oneline` 으로 마지막 배포 이후 커밋 수집
2. 커밋 내역을 한국어 사용자 친화 문구로 변환
3. 사용자에게 "이 릴리즈 노트로 올릴까요?" 확인
4. 확인 후 MCP `upload_artifact`의 release notes 파라미터로 전달

예시:
```
커밋: "fix: food 추천 로직 NPE 수정", "feat: 그룹 투표 UI 개선"
→ 릴리즈 노트: "음식 추천이 더 안정적으로 동작합니다. 그룹 투표 화면이 개선되었습니다."
```

---

## 정기 배포 플로우 (완성 후)

```
1. Claude: build.gradle versionCode +1 수정
2. Claude: npm run build:android (Next.js export + cap sync)
3. Claude: ./gradlew bundleRelease (AAB 생성)
4. Claude: git log로 릴리즈 노트 생성 → 사용자 확인
5. Claude: MCP upload_artifact(track=internal, releaseNotes=...)
6. 사용자: 본인 기기에서 설치 테스트
7. 사용자: "프로덕션 10%로 승격"
   → Claude: MCP promote_release(to=production, rollout=0.1)
8. 24~48시간 후 → Claude: Vitals 확인 → 50% → 100%
```

---

## 검증 항목

| # | 검증 | 방법 |
|---|---|---|
| 1 | `uv` / `uvx` 동작 | `uvx --version` |
| 2 | `.mcp.json` 로드 | Claude Code 재시작 후 MCP 도구 목록 확인 |
| 3 | SA 인증 | MCP `list_tracks` 호출 성공 |
| 4 | AAB 빌드 | `./gradlew bundleRelease` 종료 코드 0 |
| 5 | Internal 업로드 | Play Console Internal testing 페이지 확인 |

## 리스크 및 대응

| 리스크 | 대응 |
|---|---|
| SA 권한 부족 | Play Console에서 "프로덕션 출시" 권한 재부여 |
| versionCode 동기 깨짐 | Play Console에서 최신 versionCode 확인 후 build.gradle 수동 맞춤 |
| `uvx` 패키지명 불일치 | `pip3 install google-play-mcp` 후 `python3 -m google_play_mcp` 로 폴백 |
| MCP 서버 장애 | 수동 Play Console UI 업로드 (기존 방식) |
| Prod rollout 크래시 | MCP `halt_rollout` → 핫픽스 재빌드 |
