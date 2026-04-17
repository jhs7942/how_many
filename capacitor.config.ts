import { CapacitorConfig } from '@capacitor/cli';

// 프로덕션 URL (fallback) — 환경변수 누락 시 안전하게 프로덕션으로 기울임
const PROD_URL = 'https://how-many-mauve.vercel.app';

// 빌드 시점에 shell 환경변수로 주입: CAPACITOR_SERVER_URL=https://... npm run build:android:dev
const serverUrl: string = process.env.CAPACITOR_SERVER_URL ?? PROD_URL;

// 빌드 시 어떤 URL이 사용되는지 개발자가 즉시 확인 가능
console.log(`[capacitor.config] server.url = ${serverUrl}`);
if (!process.env.CAPACITOR_SERVER_URL) {
  console.log('[capacitor.config] CAPACITOR_SERVER_URL 미설정 → 프로덕션 URL fallback 사용');
}

const config: CapacitorConfig = {
  appId: 'com.howmany.app',
  appName: '몇명이니',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: serverUrl,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: '#FFF7F2',
      showSpinner: false,
    },
    StatusBar: {
      style: 'Light',
      backgroundColor: '#FFF7F2',
    },
  },
};

export default config;
