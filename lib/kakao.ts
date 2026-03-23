// 카카오톡 공유 유틸 — JavaScript App Key + Kakao SDK (로그인 불필요)
// 사전 조건: .env.local에 NEXT_PUBLIC_KAKAO_JS_KEY= 설정, app/layout.tsx에 SDK Script 추가

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

export function sendKakaoMessage(params: {
  title: string;
  description: string;
  imageUrl?: string;
  linkUrl: string;
  buttonText?: string;
}) {
  initKakao();
  if (typeof window === 'undefined' || !window.Kakao) return;
  window.Kakao.Share.sendDefault({
    objectType: 'feed',
    content: {
      title: params.title,
      description: params.description,
      imageUrl: params.imageUrl ?? `${window.location.origin}/og-image.png`,
      link: { mobileWebUrl: params.linkUrl, webUrl: params.linkUrl },
    },
    buttons: [{
      title: params.buttonText ?? '결과 보기',
      link: { mobileWebUrl: params.linkUrl, webUrl: params.linkUrl },
    }],
  });
}
