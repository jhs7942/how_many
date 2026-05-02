'use client';

// sessionStorage 타입 안전 헬퍼
//
// [학습] sessionStorage vs localStorage
// - sessionStorage: 탭이 살아있는 동안만 유지. 탭을 닫으면 사라짐.
// - localStorage: 도메인 단위로 영구 보존. 사용자가 직접 비우거나 만료 로직을 짜야 사라짐.
// 이 프로젝트는 "한 번의 결정 플로우"가 끝나면 자연스럽게 정리되는 게 적절하기 때문에 sessionStorage를 쓴다.
// 예) /solo/setting → /solo/random → /solo/result 사이의 임시 상태(인원수·후보·위치 등)
//
// [학습] 왜 직접 sessionStorage.setItem 을 쓰지 않고 래퍼를 만들었나?
// 1) JSON 직렬화/역직렬화를 매 호출마다 손으로 하면 실수하기 쉽다 (특히 boolean·number를 문자열로 잘못 다루는 버그).
// 2) SSR(Next.js의 서버 렌더 단계)에서는 window가 없어서 sessionStorage 접근만으로 ReferenceError가 난다.
//    `typeof window === 'undefined'` 가드를 한 곳에서 처리하면 호출부가 깨끗해진다.
// 3) 제네릭 <T> 로 타입을 보존 → 호출부에서 `session.get<number>('people')` 처럼 쓸 수 있다.
export const session = {
  set<T>(key: string, value: T): void {
    // [학습] SSR 가드 — Next.js의 서버 렌더 단계에서는 window가 없다.
    // 이 줄이 없으면 빌드는 되지만 SSR 페이지가 500을 뱉는다.
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, JSON.stringify(value));
  },
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const item = sessionStorage.getItem(key);
      if (item === null) return null;
      // [학습] JSON.parse는 잘못된 문자열(예: 사용자가 DevTools로 손댄 값)을 만나면 throw 한다.
      // try/catch로 감싸서 깨진 데이터는 null로 격리 — 한 키의 손상이 앱 전체를 죽이지 않게.
      return JSON.parse(item) as T;
    } catch {
      return null;
    }
  },
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  },
};
