// Android Capacitor 빌드 래퍼.
// static export 모드(NEXT_STATIC_EXPORT=true)는 Edge runtime과 비호환이므로
// opengraph-image.tsx를 빌드 동안 임시로 숨겼다가 복원한다.
// 사용: node scripts/build-android.mjs [dev|prod]

import { execSync } from 'node:child_process';
import { existsSync, renameSync } from 'node:fs';
import { resolve } from 'node:path';

const mode = process.argv[2] === 'dev' ? 'dev' : 'prod';
const projectRoot = resolve(import.meta.dirname, '..');
const ogFile = resolve(projectRoot, 'app/result/[id]/opengraph-image.tsx');
const hiddenFile = `${ogFile}.static-excluded`;

function hide() {
  if (existsSync(ogFile)) {
    renameSync(ogFile, hiddenFile);
    console.log('[build-android] opengraph-image.tsx를 static export에서 임시 제외');
  }
}

function restore() {
  if (existsSync(hiddenFile)) {
    renameSync(hiddenFile, ogFile);
    console.log('[build-android] opengraph-image.tsx 복원 완료');
  }
}

process.on('SIGINT', () => {
  restore();
  process.exit(130);
});
process.on('SIGTERM', () => {
  restore();
  process.exit(143);
});

function resolveServerUrl() {
  if (mode === 'dev') {
    if (!process.env.CAPACITOR_SERVER_URL) {
      console.error(
        'ERROR: CAPACITOR_SERVER_URL 환경변수 필수.\n' +
          '예: CAPACITOR_SERVER_URL=https://how-many-git-develop-xxx.vercel.app node scripts/build-android.mjs dev',
      );
      process.exit(1);
    }
    return process.env.CAPACITOR_SERVER_URL;
  }
  return 'https://how-many-mauve.vercel.app';
}

let failed = false;
try {
  hide();
  const serverUrl = resolveServerUrl();
  const env = {
    ...process.env,
    NEXT_STATIC_EXPORT: 'true',
    CAPACITOR_SERVER_URL: serverUrl,
  };
  execSync('npx next build', { stdio: 'inherit', env, cwd: projectRoot });
  execSync('npx cap sync android', { stdio: 'inherit', env, cwd: projectRoot });
} catch (error) {
  failed = true;
  console.error('[build-android] 빌드 실패:', error.message);
} finally {
  restore();
}

process.exit(failed ? 1 : 0);
