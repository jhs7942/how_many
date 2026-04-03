# 앱 아이콘 교체 및 빌드 기술 계획

## 1. 아이콘 파일 복사

### 소스 경로
`/Users/jeonghyeonseung/Downloads/몇명이니_아이콘 (1)/res/`

### 파일명 매핑 (한국어 → Android 리소스 규칙 영문)

| 원본 파일명 | 대상 파일명 |
|------------|------------|
| `몇명이니_아이콘.png` | `ic_launcher.png` + `ic_launcher_round.png` |
| `몇명이니_아이콘_adaptive_back.png` | `ic_launcher_background.png` |
| `몇명이니_아이콘_adaptive_fore.png` | `ic_launcher_foreground.png` |

### 대상 디렉토리 (5개 해상도)
```
android/app/src/main/res/mipmap-hdpi/
android/app/src/main/res/mipmap-mdpi/
android/app/src/main/res/mipmap-xhdpi/
android/app/src/main/res/mipmap-xxhdpi/
android/app/src/main/res/mipmap-xxxhdpi/
```

## 2. Adaptive Icon XML 수정

### 파일: `mipmap-anydpi-v26/ic_launcher.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

### 파일: `mipmap-anydpi-v26/ic_launcher_round.xml`
```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
```

## 3. 릴리스 빌드

```bash
# Next.js static export + Capacitor 동기화
cd /Users/jeonghyeonseung/workspaces/how_many
npm run build:android

# AAB 빌드
cd android
JAVA_HOME=/Applications/Android\ Studio.app/Contents/jbr/Contents/Home ./gradlew bundleRelease
```

### 빌드 출력
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- 서명: `android/key.properties` + `android/howmany-release.keystore` 사용
