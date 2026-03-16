# 백엔드 학습 목록

> 몇명이니 프로젝트 construction.md 기준 | 코딩 입문자용

---

## 공통 (프론트엔드와 함께 학습)

### 1. Git & GitHub
> 코드 변경 이력을 관리하고 협업하는 도구. 모든 개발자의 기본 소양.

| 주제 | 내용 |
|------|------|
| 기본 명령어 | `git init`, `git add`, `git commit`, `git push`, `git pull` |
| 브랜치 | `git branch`, `git checkout`, `git merge` — 기능별로 독립된 작업 공간 |
| 브랜치 전략 | main(배포) / develop(통합) / feature/* / fix/* 구분하는 이유 |
| 커밋 컨벤션 | `feat:`, `fix:`, `style:` 등 — 히스토리를 읽기 쉽게 |
| .gitignore | 올리면 안 되는 파일 (`.env`, `__pycache__/`, `.venv/`) 제외 |
| GitHub | 원격 저장소, PR(Pull Request), 코드 리뷰 흐름 |

---

### 2. 환경 변수 (.env)
> API 키, 비밀번호 등 코드에 직접 쓰면 안 되는 값을 관리하는 방식.

| 주제 | 내용 |
|------|------|
| .env | 백엔드 환경 변수 파일 (SECRET_KEY, DATABASE_URL 등) |
| .env.example | 팀원과 공유하는 변수 이름 목록 (값은 비워둠) |
| python-decouple | Django에서 `.env` 파일 읽는 라이브러리 (`config('SECRET_KEY')`) |
| 왜 필요한가 | DB 비밀번호, API 키를 코드에 직접 쓰면 GitHub에 올라가 보안 사고 발생 |

---

### 3. HTTP & REST API
> 프론트엔드와 백엔드가 대화하는 방식. 백엔드에서 직접 설계하는 부분.

| 주제 | 내용 |
|------|------|
| HTTP 메서드 | GET(조회), POST(생성), PUT/PATCH(수정), DELETE(삭제) |
| REST 설계 | `/api/bookmarks/` — 자원 중심 URL 설계 원칙 |
| 요청/응답 | Request(헤더·바디), Response(상태코드·JSON 바디) |
| 상태 코드 | 200(성공), 201(생성됨), 400(잘못된 요청), 401(인증 필요), 404(없음), 500(서버 오류) |
| JSON | 프론트-백엔드가 데이터를 주고받는 형식 |
| CORS | 프론트엔드 도메인에서 백엔드 API 호출 허용 설정 |

---

### 4. 인증 (JWT & OAuth)
> 로그인 상태를 유지하고 "이 사람이 맞다"를 증명하는 방식.

| 주제 | 내용 |
|------|------|
| 세션 vs JWT | 세션은 서버가 기억, JWT는 토큰 자체에 정보 포함 |
| Access Token | 짧은 유효기간(15분~1시간), API 요청 시 헤더에 포함 |
| Refresh Token | 긴 유효기간, Access Token 만료 시 재발급에 사용 |
| OAuth | 카카오/구글이 "이 사람 맞아요"를 대신 확인해주는 방식 |
| Authorization 헤더 | `Authorization: Bearer {token}` — API 요청 시 신원 증명 |
| Django JWT 발급 흐름 | NextAuth 소셜 로그인 완료 → Django `POST /api/auth/social/` → JWT 반환 |

---

## 백엔드 전용

### 5. Python 기초
> Django의 기반 언어. 먼저 익혀야 Django가 이해됨.

| 주제 | 내용 |
|------|------|
| 변수·자료형 | `str`, `int`, `list`, `dict`, `bool` |
| 함수 | `def`, 매개변수, 반환값 |
| 클래스 | `class`, 상속, `__init__` — Django 모델/뷰가 모두 클래스 기반 |
| 가상환경 | `python -m venv .venv` — 프로젝트별 패키지 격리 |
| pip | `pip install django` — 패키지 설치 도구 |
| requirements.txt | 프로젝트에 필요한 패키지 목록 (`pip freeze > requirements.txt`) |
| f-string | `f"안녕 {name}"` — 문자열 포매팅 |
| 리스트 컴프리헨션 | `[x for x in items if x.active]` — 자주 쓰는 패턴 |

---

### 6. Django 기초
> Python 웹 프레임워크. "배터리 포함" — 인증, DB, 관리자 페이지가 기본 내장.

| 주제 | 내용 |
|------|------|
| MTV 패턴 | Model(데이터), Template(화면), View(로직) — MVC와 같은 개념 |
| manage.py | Django 프로젝트 관리 명령어 진입점 |
| 앱(App) | 기능 단위로 분리된 모듈 — `users`, `bookmarks`, `places` |
| settings.py | 프로젝트 설정 (DB, 설치된 앱, 미들웨어 등) |
| urls.py | URL과 View 연결 (`path('api/bookmarks/', views.BookmarkView.as_view())`) |
| Migration | DB 테이블 변경사항을 코드로 관리 (`makemigrations`, `migrate`) |
| Admin | `/admin` — 데이터 관리 UI 자동 생성 |
| settings 분리 | `base.py` / `local.py` / `production.py` — 환경별 설정 분리 |

---

### 7. Django ORM (데이터베이스 연동)
> SQL을 직접 안 써도 Python 코드로 DB를 조작하는 방법.

| 주제 | 내용 |
|------|------|
| 모델 | `class Bookmark(models.Model)` — DB 테이블을 Python 클래스로 정의 |
| 필드 타입 | `CharField`, `IntegerField`, `ForeignKey`, `DateTimeField` |
| CRUD | `.create()`, `.filter()`, `.get()`, `.update()`, `.delete()` |
| ForeignKey | 테이블 간 관계 — 북마크가 어느 사용자의 것인지 연결 |
| QuerySet | ORM 조회 결과 — 필터, 정렬, 슬라이싱 가능 |
| SQL vs ORM | SQL `SELECT * FROM bookmarks WHERE user_id=1` → ORM `Bookmark.objects.filter(user=user)` |

---

### 8. Django REST Framework (DRF)
> Django에서 REST API를 쉽게 만들게 해주는 라이브러리. 별도 설치 필요 (`pip install djangorestframework`).

| 주제 | 내용 |
|------|------|
| Serializer | Python 객체 ↔ JSON 변환 담당 — 입력 유효성 검사도 포함 |
| APIView | HTTP 메서드별(GET/POST/DELETE) 처리 로직 작성 |
| ViewSet | CRUD를 하나의 클래스에서 처리 — 코드 줄어듦 |
| Router | ViewSet에 URL 자동 연결 |
| Permission | `IsAuthenticated` — 로그인한 사람만 접근 허용 |
| Response | DRF의 JSON 응답 객체 (`Response(data, status=200)`) |
| Browsable API | 개발 중 브라우저에서 API 직접 테스트 가능한 UI |

---

### 9. JWT 인증 (djangorestframework-simplejwt)
> 별도 설치 라이브러리. Django에 JWT 발급/검증 기능을 추가.

| 주제 | 내용 |
|------|------|
| 설치 | `pip install djangorestframework-simplejwt` |
| 토큰 발급 | `POST /api/auth/social/` → access + refresh 토큰 반환 |
| 토큰 갱신 | `POST /api/auth/token/refresh/` → 새 access 토큰 발급 |
| 토큰 검증 | API 요청 헤더의 토큰을 자동 검증 |
| 설정 | `SIMPLE_JWT` 딕셔너리로 만료 시간 등 설정 |

---

### 10. CORS (django-cors-headers)
> 프론트엔드(Vercel)에서 백엔드(Fly.io)로 API 요청할 때 브라우저가 막는 것을 허용.

| 주제 | 내용 |
|------|------|
| CORS란 | 다른 도메인 간 요청을 브라우저가 기본 차단하는 보안 정책 |
| 설치 | `pip install django-cors-headers` |
| 설정 | `CORS_ALLOWED_ORIGINS = ['https://howmany.vercel.app']` |
| 왜 필요한가 | 프론트(`vercel.app`)와 백엔드(`fly.dev`)가 다른 도메인이라 반드시 필요 |

---

### 11. PostgreSQL & Supabase
> 실제 데이터를 저장하는 관계형 데이터베이스.

| 주제 | 내용 |
|------|------|
| 관계형 DB 개념 | 테이블, 행, 열, 기본키(PK), 외래키(FK) |
| SQL 기초 | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `JOIN` |
| PostgreSQL | MySQL과 비슷한 오픈소스 DB — Django의 가장 권장 DB |
| psycopg2-binary | Django ↔ PostgreSQL 연결 드라이버 (`pip install psycopg2-binary`) |
| Supabase | PostgreSQL을 무료로 호스팅해주는 서비스 (500MB 무료) |
| DATABASE_URL | `postgresql://user:password@host:5432/dbname` — 연결 문자열 형식 |
| Django migrate | `python manage.py migrate` — 모델을 실제 DB 테이블로 생성 |

---

### 12. Django 프로젝트 구조
> construction.md의 백엔드 폴더 구조 이해.

| 경로 | 역할 |
|------|------|
| `config/settings/base.py` | 공통 설정 (설치된 앱, 미들웨어, DB 등) |
| `config/settings/local.py` | 로컬 개발용 설정 (`DEBUG=True`) |
| `config/settings/production.py` | 배포 환경 설정 (`DEBUG=False`, 보안 강화) |
| `config/urls.py` | 전체 URL 라우팅 |
| `config/wsgi.py` | 웹 서버(gunicorn)와 Django 연결 진입점 |
| `apps/users/` | 사용자 모델 + 소셜 로그인 JWT 발급 |
| `apps/bookmarks/` | 찜 CRUD (목록·추가·삭제) |
| `apps/places/` | 장소 데이터 API |
| `apps/search_history/` | 검색 이력 CRUD |
| `requirements/base.txt` | 공통 패키지 |
| `requirements/production.txt` | 배포 환경 추가 패키지 |
| `Procfile` | Fly.io 배포 시 실행 명령 (`web: gunicorn config.wsgi`) |

---

### 13. API 엔드포인트 설계
> construction.md에 정의된 API를 어떤 기준으로 설계했는지 이해.

```
# 인증
POST   /api/auth/social/         소셜 로그인 → JWT 발급
POST   /api/auth/token/refresh/  access token 재발급

# 북마크
GET    /api/bookmarks/           찜 목록 조회
POST   /api/bookmarks/           찜 추가 { place_id }
DELETE /api/bookmarks/{id}/      찜 삭제

# 방문이력
GET    /api/visits/              방문이력 조회
POST   /api/visits/              방문 표시 { place_id }

# 검색이력
GET    /api/search-history/      최근 검색 이력 (최대 5개)
POST   /api/search-history/      검색 이력 저장

# 장소
GET    /api/places/              장소 목록 (필터 파라미터)
GET    /api/places/{id}/         장소 상세
GET    /api/places/random/       랜덤 장소
```

| 설계 원칙 | 내용 |
|----------|------|
| 명사 사용 | `/api/bookmarks/` — 동사(`/api/addBookmark/`) 쓰지 않음 |
| HTTP 메서드로 동작 구분 | 같은 URL, 다른 메서드로 CRUD 표현 |
| 복수형 | `/bookmarks/`, `/places/` — 컬렉션은 복수형 |

---

### 14. 배포 (Fly.io)
> 백엔드 서버를 인터넷에 올리는 방법.

| 주제 | 내용 |
|------|------|
| gunicorn | Django 개발 서버(`runserver`)는 배포에 부적합 → gunicorn으로 교체 |
| whitenoise | 정적 파일(CSS, JS)을 Django에서 직접 서빙하는 미들웨어 |
| Fly.io | 무료 플랜에서도 sleep 없음 — 항상 응답 가능 |
| fly.toml | Fly.io 배포 설정 파일 (리전, 포트, 메모리) |
| fly launch | 한 번 실행으로 기본 설정 자동 생성 |
| fly secrets set | 환경 변수 등록 (`SECRET_KEY`, `DATABASE_URL` 등) |
| 리전 | `nrt` (도쿄) — 한국 사용자 기준 가장 가까운 서버 위치 |
| Cold Start | 서버가 절전 상태일 때 첫 요청이 느린 현상 (Fly.io 무료는 해당 없음) |

---

### 15. 백엔드 개발 흐름
> 기능 하나를 추가할 때 작업 순서.

```
1. 모델 정의 (apps/bookmarks/models.py)
   → DB 테이블 구조 설계

2. 마이그레이션 생성 & 적용
   python manage.py makemigrations
   python manage.py migrate

3. Serializer 작성 (serializers.py)
   → 모델 ↔ JSON 변환 규칙

4. View 작성 (views.py)
   → GET/POST/DELETE 각각의 로직

5. URL 연결 (urls.py)
   → 경로와 View 연결

6. 테스트
   → Browsable API 또는 Postman으로 확인
```

---

## 학습 순서 추천

```
1단계 (기초)
  Python 기초 → 자료형·함수·클래스·가상환경

2단계 (Django)
  Django 설치 → MTV 패턴 → 모델·마이그레이션 → Admin

3단계 (데이터베이스)
  SQL 기초 → PostgreSQL → Django ORM

4단계 (API)
  HTTP/REST 개념 → Django REST Framework → Serializer · APIView

5단계 (인증·보안)
  JWT 개념 → simplejwt → CORS 설정

6단계 (배포)
  환경 변수 관리 → gunicorn → Fly.io 배포 → Supabase 연결
```
