Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$backofficeDir = Join-Path $repoRoot 'app\frontend\backoffice-app'

Write-Host 'Starting Docker services for backend and backoffice...'
docker compose up -d --build db redis backend backoffice-app

Write-Host 'Running backend pytest suite...'
docker compose exec backend python -m pytest

Write-Host 'Running backoffice Playwright E2E suite...'
npm --prefix $backofficeDir run test:e2e
