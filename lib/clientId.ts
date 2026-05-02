// 익명 클라이언트 식별자 — 그룹 플로우의 호스트 프레즌스, 투표 중복 방지 등에 쓰인다.
//
// [학습] 왜 sessionStorage가 아닌 localStorage 인가?
// session.ts와 달리 clientId는 "이 기기를 다시 알아보기 위한 영구 식별자"다.
// 사용자가 탭을 닫았다가 다시 들어와도 같은 사람으로 인식해야 호스트 프레즌스(useHostPresence)나
// "내가 이미 투표한 방"을 정확히 매칭할 수 있다. 그래서 탭이 죽어도 살아남는 localStorage를 쓴다.
const CLIENT_ID_KEY = 'clientId';

export function getClientId(): string {
  // [학습] SSR 가드 — 서버 렌더 단계에는 window/localStorage가 없다.
  // 빈 문자열을 돌려주면 호출부에서 그 값을 그대로 쓸 수 있도록 자연스러운 기본값이 된다
  // (실제로 서버에서는 이 값을 사용할 일이 없고, 클라이언트에서 useEffect 등을 통해 다시 호출된다).
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(CLIENT_ID_KEY);
  if (!id) {
    // [학습] crypto.randomUUID() 는 브라우저가 기본 제공하는 RFC 4122 v4 UUID 생성기.
    // 별도 라이브러리(uuid) 없이 충분히 안전한 식별자를 만들 수 있다.
    // (단, HTTPS 또는 localhost 컨텍스트에서만 동작 — 일반 http 페이지에선 undefined)
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
  }
  return id;
}
