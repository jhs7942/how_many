import type { Metadata, Viewport } from "next";
import Script from 'next/script';
import "./globals.css";
import PaletteDevTool from '@/components/PaletteDevTool'; // [TEST]
import UrlNormalizer from '@/components/UrlNormalizer';
import AndroidBackHandler from '@/components/AndroidBackHandler';

export const metadata: Metadata = {
  title: "몇명이니 — 모임 결정 서비스",
  description: "단톡방 30분 토론은 이제 그만! 혼자도, 같이도 빠르게 결정해요.",
};

export const viewport: Viewport = {
  themeColor: "#FF7A3D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>
        <AndroidBackHandler />
        <UrlNormalizer />
        {children}
        <PaletteDevTool /> {/* [TEST] 색상 팔레트 테스트 기능 */}
        <Script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
