import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

/** Krátký hash commitu, ze kterého se hra sestavuje (Cloudflare Workers Builds, GitHub Actions, nebo lokální git). */
function commitSha(): string {
  const fromCi = process.env.WORKERS_CI_COMMIT_SHA ?? process.env.GITHUB_SHA;
  if (fromCi) return fromCi.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return 'dev';
  }
}

export default defineConfig({
  plugins: [preact()],
  define: {
    __APP_VERSION__: JSON.stringify(`${commitSha()} · ${new Date().toISOString().slice(0, 10)}`),
  },
  server: {
    // Při `npm run dev` posílá API požadavky na `wrangler dev` (port 8787).
    proxy: { '/api': 'http://localhost:8787' },
  },
});
