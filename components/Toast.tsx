'use client';

import { useRef, useState, useCallback } from 'react';

// 화면 하단에 잠깐 떴다 사라지는 토스트 메시지 컴포넌트.
//
// [학습] visible prop 으로 "표시/숨김 상태"만 받는 이유
// 컴포넌트 자체는 "메시지를 보여줄지 말지" 만 책임지는 dumb 컴포넌트로 두고,
// "언제 떠야 하는지" 는 useToast 훅(또는 호출부)이 결정한다 — 책임 분리.
// transform / opacity 트랜지션으로 부드럽게 등장·퇴장.

interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div
      data-testid="toast-message"
      style={{
        position: 'fixed',
        // [학습] env(safe-area-inset-bottom) — 아이폰 X 이후의 홈 인디케이터 영역을 피하기 위한 CSS 변수.
        // max(96px, ...) 로 감싸서 "최소 96px 이상"이라는 마진을 보장. 안 그러면 안드로이드 일반 화면에서 너무 바닥에 붙는다.
        bottom: 'max(96px, calc(48px + env(safe-area-inset-bottom, 0px)))',
        left: '50%',
        // [학습] transform 으로 좌우 중앙 + 등장/퇴장 애니메이션을 한 번에 처리.
        // visible=false 일 때는 80px 아래로 내리고 opacity 0 → 화면 바깥으로 밀려나는 듯한 효과.
        transform: `translateX(-50%) translateY(${visible ? '0' : '80px'})`,
        opacity: visible ? 1 : 0,
        background: 'rgba(46, 46, 46, 0.92)',
        color: '#fff',
        padding: '12px 22px',
        borderRadius: 9999,
        fontSize: 14,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 999,
        // [학습] pointerEvents: 'none' — 토스트 위로 마우스/터치가 그대로 통과하게 만든다.
        // 이게 없으면 화면 하단의 버튼이 토스트에 가려 클릭이 안 되는 문제가 생긴다.
        pointerEvents: 'none',
        maxWidth: 'calc(100% - 40px)',
      }}
    >
      {message}
    </div>
  );
}

// 전역 토스트 훅
//
// [학습] 커스텀 훅 만드는 법
// "use" 로 시작하면 React 가 훅으로 인식한다. 안에서 다른 훅(useState, useRef)을 사용 가능.
// 내부 상태와 함수만 외부에 노출하면, 호출부는 컴포넌트만큼 단순해진다 — `const { toast, showToast } = useToast()`.
//
// [학습] 왜 timer를 useRef 로 보관하나?
// useState 로 두면 setTimer 가 매 호출마다 재렌더를 트리거한다. 타이머는 화면에 보일 일이 없으니 ref가 적합.
// 또한 새 showToast 호출 시 이전 타이머를 clearTimeout 해야 "토스트가 두 번 빠르게 뜨면 첫 번째 것이 빨리 안 사라짐" 버그를 막는다.
export function useToast() {
  const [toast, setToast] = useState({ message: '', visible: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // [학습] useCallback — 의존성이 없을 때 함수 ref 가 매 렌더마다 새로 만들어지는 것을 방지.
  // showToast 를 자식 컴포넌트에 props 로 내려보낼 때 React.memo / useEffect 의존성 등에서 안정성을 갖는다.
  const showToast = useCallback((message: string, duration = 2000) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ message, visible: true });
    timerRef.current = setTimeout(
      // [학습] 함수형 setState — `prev => ...` 로 받으면 최신 상태를 보장.
      // 여기선 message는 그대로 두고 visible만 false 로 바꾸는데, 직접 객체를 새로 만들면 직전 message 가 사라져
      // 사라지는 애니메이션 도중 텍스트가 빈 문자열로 바뀌어 깜빡이는 버그가 생긴다.
      () => setToast(prev => ({ ...prev, visible: false })),
      duration
    );
  }, []);

  return { toast, showToast };
}
