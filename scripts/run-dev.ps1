<#
.SYNOPSIS
  MyBeautify Store - Run Workflow Script (PowerShell)
.DESCRIPTION
  1. Verifies Spring Boot backend on http://localhost:8080
  2. Checks if Vite frontend is already running on port 5173
  3. Starts Vite dev server if not running
  4. Waits until http://localhost:5173/ is accessible
  5. Opens Google Chrome at http://localhost:5173/ (reuses existing window as new tab)
#>

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StoreRootDir = Split-Path -Parent $ScriptDir

$BackendUrl = "http://localhost:8080/api/healthz"
$BackendProjectDir = "C:\Users\HP\OneDrive\Desktop\cosmeticszainab"
$FrontendUrl = "http://localhost:5173/"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Magenta
Write-Host "🌸 MyBeautify Store — Run Without Debugging Workflow" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Magenta
Write-Host ""

# 1. Verify Backend on port 8080
Write-Host "[MyBeautify] Checking Spring Boot backend on port 8080..." -ForegroundColor Yellow
$backendUp = $false
try {
  $tcp = Test-NetConnection -ComputerName "localhost" -Port 8080 -WarningAction SilentlyContinue
  if ($tcp.TcpTestSucceeded) {
    $backendUp = $true
  }
} catch {
  $backendUp = $false
}

if (-not $backendUp) {
  Write-Host ""
  Write-Host "======================================================================" -ForegroundColor Red
  Write-Host "❌ [ERROR] Spring Boot backend is NOT responding on port 8080!" -ForegroundColor Red
  Write-Host "----------------------------------------------------------------------" -ForegroundColor Red
  Write-Host "The frontend requires the Spring Boot backend to function properly." -ForegroundColor Yellow
  Write-Host ""
  Write-Host "ACTION REQUIRED:" -ForegroundColor Cyan
  Write-Host "1. Open IntelliJ IDEA." -ForegroundColor White
  Write-Host "2. Open backend project at: $BackendProjectDir" -ForegroundColor White
  Write-Host "3. Start the Spring Boot Application (port 8080, context path /api)." -ForegroundColor White
  Write-Host "4. Once started in IntelliJ, click 'Run Without Debugging' in Antigravity." -ForegroundColor White
  Write-Host "======================================================================" -ForegroundColor Red
  Write-Host ""
  exit 1
}

Write-Host "[MyBeautify] ✅ Spring Boot backend is RUNNING on http://localhost:8080 (context path: /api)." -ForegroundColor Green

# 2. Check if Frontend is already running
Write-Host "[MyBeautify] Checking if Vite frontend is already running on port 5173..." -ForegroundColor Yellow
$frontendUp = $false
try {
  $tcp5173 = Test-NetConnection -ComputerName "localhost" -Port 5173 -WarningAction SilentlyContinue
  if ($tcp5173.TcpTestSucceeded) {
    $frontendUp = $true
  }
} catch {
  $frontendUp = $false
}

if ($frontendUp) {
  Write-Host "[MyBeautify] ℹ️ Vite frontend is ALREADY running at http://localhost:5173/." -ForegroundColor Cyan
  Write-Host "[MyBeautify] ℹ️ Reusing existing instance (no duplicate Vite process started)." -ForegroundColor Cyan
  Start-Process "chrome.exe" $FrontendUrl
  Write-Host "[MyBeautify] ✨ Done! Chrome opened at http://localhost:5173/" -ForegroundColor Green
  exit 0
}

# 3. Start Vite Dev Server
Write-Host "[MyBeautify] Starting Vite frontend development server on port 5173..." -ForegroundColor Cyan
$pnpm = Get-Command pnpm.cmd, pnpm -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
if (-not $pnpm) {
  $pnpm = "pnpm"
}

$proc = Start-Process -FilePath $pnpm -ArgumentList "--filter", "@workspace/mybeautify-store", "dev" -WorkingDirectory $StoreRootDir -PassThru

# 4. Wait for Vite to be ready
Write-Host "[MyBeautify] Waiting for frontend server to be ready on http://localhost:5173/..." -ForegroundColor Yellow
$ready = $false
for ($i = 0; $i -lt 60; $i++) {
  Start-Sleep -Milliseconds 500
  try {
    $resp = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
      $ready = $true
      break
    }
  } catch {}
}

if (-not $ready) {
  Write-Host "❌ Timed out waiting for Vite frontend to start on http://localhost:5173/!" -ForegroundColor Red
  exit 1
}

Write-Host "[MyBeautify] ✅ Frontend development server is ready at http://localhost:5173/!" -ForegroundColor Green

# 5. Open Google Chrome
Start-Process "chrome.exe" $FrontendUrl
Write-Host "[MyBeautify] ✨ Opened Google Chrome at http://localhost:5173/" -ForegroundColor Green
Write-Host "[MyBeautify] Frontend is running (Process ID: $($proc.Id))." -ForegroundColor Cyan
