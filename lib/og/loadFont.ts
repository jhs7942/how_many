// Satori(Edge runtime)용 Pretendard 폰트 ArrayBuffer 로더.
// `new URL(..., import.meta.url)` 패턴으로 번들에 포함된 폰트를 읽는다.
// Edge instance 생명주기 동안 모듈 스코프 캐시에 보관.

let cache: [ArrayBuffer, ArrayBuffer] | null = null;

export async function loadPretendard(): Promise<[ArrayBuffer, ArrayBuffer]> {
  if (cache) return cache;
  const [regular, bold] = await Promise.all([
    fetch(new URL('./fonts/Pretendard-Regular.otf', import.meta.url)).then((r) =>
      r.arrayBuffer(),
    ),
    fetch(new URL('./fonts/Pretendard-Bold.otf', import.meta.url)).then((r) =>
      r.arrayBuffer(),
    ),
  ]);
  cache = [regular, bold];
  return cache;
}
