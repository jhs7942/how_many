# 프로토타입 브랜치 GitHub 푸시 계획

## Context

현재 HTML/CSS/JS로 구현된 13화면 프로토타입을 `prototype` 브랜치로 분리해 GitHub에 푸시.
`main` 브랜치는 향후 Next.js 등 실제 개발용으로 보존하고,
`prototype` 브랜치는 Vercel 정적 배포 및 UI 레퍼런스로 활용.

---

## 실행 순서

### 1단계 — 현재 상태 확인
```bash
git status
git remote -v
```
- 원격 remote가 없으면 GitHub 레포 생성 필요 (`gh repo create how_many --public`)

### 2단계 — prototype 브랜치 생성
```bash
git checkout -b prototype
```

### 3단계 — 전체 파일 스테이징 & 커밋
```bash
git add index.html vercel.json css/ js/ pages/
git commit -m "feat: HTML/CSS/JS 프로토타입 13화면 퍼블리싱"
```

커밋 대상 파일:
- `index.html` — 스플래시 + 홈
- `vercel.json` — cleanUrls 설정
- `css/style.css` — 공통 디자인 토큰 및 컴포넌트
- `js/main.js` — 돌림판, 세션, 유틸
- `pages/solo-people.html` ~ `pages/group-result.html` (11개)

### 4단계 — GitHub 푸시
```bash
git push -u origin prototype
```
- remote가 없으면 먼저 `gh repo create how_many --public --source=. --remote=origin` 실행

---

## 브랜치 전략

```
main        ← 향후 Next.js 실제 개발
prototype   ← 현재 HTML/CSS/JS 프로토타입 (Vercel 배포 가능)
```

---

## 검증

- GitHub 레포에서 `prototype` 브랜치 파일 확인
- Vercel에서 `prototype` 브랜치 선택 → 정적 배포 가능 여부 확인
