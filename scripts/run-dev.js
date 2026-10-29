/**
 * MyBeautify Store - Run Workflow Script
 * 
 * 1. Verifies Spring Boot backend on http://localhost:8080
 * 2. Checks if Vite frontend is already running on port 5173 (avoids duplicates)
 * 3. Starts Vite frontend if not already running
 * 4. Waits until http://localhost:5173/ is accessible
 * 5. Opens Google Chrome at http://localhost:5173/ (reuses existing window as new tab)
 */

import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, exec } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storeRootDir = path.resolve(__dirname, '..');

const RENDER_BACKEND_URL = 'https://malkaz.onrender.com/api/healthz';
const BACKEND_URL = 'http://localhost:8080/api/healthz';
const BACKEND_PORT = 8080;
const FRONTEND_PORT = 5173;
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}/`;
const BACKEND_PROJECT_DIR = 'C:\\Users\\HP\\OneDrive\\Desktop\\cosmeticszainab';

function log(msg) {
  console.log(`[MyBeautify] ${msg}`);
}

function checkPort(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isConnected = false;

    socket.setTimeout(timeout);
    socket.once('connect', () => {
      isConnected = true;
      socket.destroy();
      resolve(true);
    });

    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });

    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

function checkHttp(url, timeout = 3000) {
  return new Promise((resolve) => {
    const isHttps = url.startsWith('https:');
    const client = isHttps ? https : http;
    const req = client.get(url, { timeout }, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function isBackendRunning() {
  const remoteOk = await checkHttp(RENDER_BACKEND_URL);
  if (remoteOk) return { ok: true, source: 'Render (https://malkaz.onrender.com/api)' };

  const portOpen = await checkPort(BACKEND_PORT);
  if (portOpen) {
    const httpOk = await checkHttp(BACKEND_URL);
    if (httpOk || portOpen) return { ok: true, source: 'Local port 8080' };
  }
  return { ok: false };
}

async function isFrontendRunning() {
  const portOpen = await checkPort(FRONTEND_PORT);
  if (!portOpen) return false;
  return await checkHttp(FRONTEND_URL);
}

function openChrome(url) {
  log(`Opening Google Chrome at ${url}...`);
  if (process.platform === 'win32') {
    // Windows 'start chrome <url>' opens in existing Chrome window as a new tab if open,
    // or launches Chrome if not open. Avoids unnecessary new blank profile windows.
    exec(`start chrome "${url}"`, (err) => {
      if (err) {
        log(`Warning: Failed to launch via 'start chrome', falling back to default browser open...`);
        exec(`start "" "${url}"`);
      }
    });
  } else if (process.platform === 'darwin') {
    exec(`open -a "Google Chrome" "${url}"`);
  } else {
    exec(`google-chrome "${url}" || xdg-open "${url}"`);
  }
}

async function waitForFrontend(timeoutMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await isFrontendRunning()) {
      return true;
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function main() {
  console.log('\n======================================================================');
  console.log('🌸 MyBeautify Store — Run Without Debugging Workflow');
  console.log('======================================================================\n');

  // 1. Verify Backend is running
  log('Checking backend API (Render: https://malkaz.onrender.com/api or Local port 8080)...');
  const backendStatus = await isBackendRunning();
  if (!backendStatus.ok) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ [ERROR] Backend is NOT responding!');
    console.error('----------------------------------------------------------------------');
    console.error('The frontend requires the backend API to function properly.');
    console.error('Checked: https://malkaz.onrender.com/api and http://localhost:8080/api');
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }
  log(`✅ Backend is ACTIVE and responding via ${backendStatus.source}.`);

  // 2. Check Frontend status
  log('Checking if Vite frontend is already running on port 5173...');
  const frontendAlreadyRunning = await isFrontendRunning();

  if (frontendAlreadyRunning) {
    log('ℹ️ Vite frontend is ALREADY running at http://localhost:5173/.');
    log('ℹ️ Reusing existing instance (no duplicate Vite process started).');
    openChrome(FRONTEND_URL);
    log('✨ Done! Chrome opened at http://localhost:5173/');
    return;
  }

  // 3. Start Vite Dev Server
  log('Starting Vite frontend development server on port 5173...');
  const isWin = process.platform === 'win32';
  const pnpmCmd = isWin ? 'pnpm.cmd' : 'pnpm';

  const viteChild = spawn(pnpmCmd, ['--filter', '@workspace/mybeautify-store', 'dev'], {
    cwd: storeRootDir,
    stdio: 'inherit',
    shell: true,
  });

  const cleanup = () => {
    try {
      if (viteChild && !viteChild.killed) {
        if (isWin && viteChild.pid) {
          exec(`taskkill /pid ${viteChild.pid} /T /F`);
        } else {
          viteChild.kill('SIGTERM');
        }
      }
    } catch {}
  };

  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });
  process.on('exit', cleanup);

  viteChild.on('error', (err) => {
    console.error('Failed to start Vite server:', err);
    process.exit(1);
  });

  // 4. Wait for Vite to accept connections
  log('Waiting for frontend server to be ready on http://localhost:5173/...');
  const ready = await waitForFrontend();
  if (!ready) {
    console.error('❌ Timed out waiting for Vite frontend to start on http://localhost:5173/!');
    cleanup();
    process.exit(1);
  }

  log('✅ Frontend development server is ready at http://localhost:5173/!');

  // 5. Open Google Chrome
  openChrome(FRONTEND_URL);

  log('✨ All systems ready! Vite server streaming below (Ctrl+C to stop):\n');
}

main().catch((err) => {
  console.error('Fatal error during startup:', err);
  process.exit(1);
});
