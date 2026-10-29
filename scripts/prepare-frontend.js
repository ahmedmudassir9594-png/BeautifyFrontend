/**
 * MyBeautify Store - Pre-launch Task Script
 * Used by VS Code tasks.json before launching Chrome.
 * 
 * 1. Checks Spring Boot backend on http://localhost:8080 (fails if not running)
 * 2. If frontend is already running on port 5173, signals ready immediately
 * 3. If frontend is not running, starts Vite dev server
 */

import http from 'node:http';
import https from 'node:https';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const storeRootDir = path.resolve(__dirname, '..');

const RENDER_BACKEND_URL = 'https://malkaz.onrender.com/api/healthz';
const BACKEND_PORT = 8080;
const FRONTEND_PORT = 5173;
const FRONTEND_URL = `http://localhost:${FRONTEND_PORT}/`;
const BACKEND_PROJECT_DIR = 'C:\\Users\\HP\\OneDrive\\Desktop\\cosmeticszainab';

function checkPort(port, host = '127.0.0.1', timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(timeout);
    socket.once('connect', () => {
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

async function main() {
  console.log('\n[MyBeautify] Verifying environment...');

  // 1. Check backend on Render or port 8080
  const renderUp = await checkHttp(RENDER_BACKEND_URL);
  const localUp = renderUp ? false : await checkPort(BACKEND_PORT);
  if (!renderUp && !localUp) {
    console.error('\n' + '='.repeat(70));
    console.error('❌ [ERROR] Backend is NOT responding!');
    console.error('----------------------------------------------------------------------');
    console.error('Checked: https://malkaz.onrender.com/api and http://localhost:8080/api');
    console.error('='.repeat(70) + '\n');
    process.exit(1);
  }
  console.log(`✅ Backend is active (${renderUp ? 'Render: https://malkaz.onrender.com/api' : 'Local port 8080'}).`);

  // 2. Check if frontend is already running
  const frontendRunning = (await checkPort(FRONTEND_PORT)) && (await checkHttp(FRONTEND_URL));
  if (frontendRunning) {
    console.log('ℹ️ Frontend server is already running: Local: http://localhost:5173/');
    // Keep alive or exit cleanly
    return;
  }

  // 3. Start Vite
  console.log('🚀 Starting Vite frontend server...');
  const isWin = process.platform === 'win32';
  const pnpmCmd = isWin ? 'pnpm.cmd' : 'pnpm';

  const child = spawn(pnpmCmd, ['--filter', '@workspace/mybeautify-store', 'dev'], {
    cwd: storeRootDir,
    stdio: 'inherit',
    shell: true,
  });

  child.on('error', (err) => {
    console.error('Failed to run Vite:', err);
    process.exit(1);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
