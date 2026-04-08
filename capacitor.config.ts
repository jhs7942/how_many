import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.howmany.app',
  appName: '몇명이니',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    url: 'https://how-many-mauve.vercel.app',
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
