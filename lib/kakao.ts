// 카카오톡 공유 유틸 — JavaScript App Key + Kakao SDK (로그인 불필요)
// 사전 조건: .env.local에 NEXT_PUBLIC_KAKAO_JS_KEY= 설정, app/layout.tsx에 SDK Script 추가
import { getAppBaseUrl } from '@/lib/utils';

declare global {
  interface Window {
    Kakao?: {
      isInitialized: () => boolean;
      init: (key: string) => void;
      Share: {
        sendDefault: (params: object) => void;
      };
    };
  }
}

export function initKakao() {
  if (typeof window === 'undefined' || !window.Kakao) return;
  if (!window.Kakao.isInitialized()) {
    window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY!);
  }
}

export async function sendKakaoMessage(params: {
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl: string;
  buttonText?: string;
}) {
  // Capacitor 네이티브 앱: OS 공유 시트 사용 (WebView가 kakaolink:// 스킴 차단)
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Share } = await import('@capacitor/share');
      await Share.share({
        title: params.title,
        text: `${params.description}\n${params.linkUrl}`,
        url: params.linkUrl,
        dialogTitle: '공유하기',
      });
      return;
    }
  } catch {
    // 네이티브 플러그인 로드 실패 시 웹 SDK로 폴백
  }

  // 웹: Kakao JS SDK
  initKakao();
  if (typeof window === 'undefined' || !window.Kakao) return;
  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: params.title,
      description: params.description,
      imageUrl: params.imageUrl ?? `${getAppBaseUrl()}/og-image.png`,
      link: { mobileWebUrl: params.linkUrl, webUrl: params.linkUrl },
    },
    buttons: [{
      title: params.buttonText ?? '결과 보기',
      link: { mobileWebUrl: params.linkUrl, webUrl: params.linkUrl },
    }],
  });
}
