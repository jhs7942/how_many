# 앱 아이콘 교체 및 빌드 계획

## 요구사항
- 다운로드 폴더의 새 아이콘 이미지를 Android 앱 아이콘으로 교체
- 교체 후 릴리스 AAB 빌드 수행

## 작업 범위
1. 각 해상도 mipmap 디렉토리에 새 아이콘 파일 복사 (영문 파일명으로 변환)
2. Adaptive 아이콘 XML 업데이트
3. 릴리스 AAB 빌드 (./gradlew bundleRelease)

## 대상 해상도
- mipmap-hdpi, mdpi, xhdpi, xxhdpi, xxxhdpi
- mipmap-anydpi-v26 (adaptive icon XML)
