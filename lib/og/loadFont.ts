// Satori(Node.js Serverless runtime)용 Pretendard 폰트 로더.
// Next.js 가 `new URL(..., import.meta.url)` 패턴을 nft 로 추적해 Serverless 번들에 폰트 파일을 포함시킨다.
// Node.js 에서는 `file://` URL 을 fetch 할 수 없으므로 fs.readFile 로 로드.

import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

let cache: [Buffer, Buffer] | null = null;

const REGULAR_URL = new URL('./fonts/Pretendard-Regular.otf', import.meta.url);
const BOLD_URL = new URL('./fonts/Pretendard-Bold.otf', import.meta.url);

export async function loadPretendard(): Promise<[Buffer, Buffer]> {
  if (cache) return cache;
  const [regular, bold] = await Promise.all([
    readFile(fileURLToPath(REGULAR_URL)),
    readFile(fileURLToPath(BOLD_URL)),
  ]);
  cache = [regular, bold];
  return cache;
}
