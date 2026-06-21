param(
    [switch]$Rebuild
)

$ErrorActionPreference = "Stop"

function Write-Step($message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Cyan
}

function Invoke-Checked($command, $arguments, [switch]$Quiet) {
    $prevErrorAction = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        if ($Quiet) {
            $output = & $command @arguments 2>&1
        } else {
            & $command @arguments
        }
    } finally {
        $ErrorActionPreference = $prevErrorAction
    }

    if ($LASTEXITCODE -ne 0) {
        if ($Quiet -and $output) {
            $output | Select-Object -Last 80 | ForEach-Object { Write-Host $_ }
        }
        throw "$command $($arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

function Test-DockerImage($imageName) {
    & docker image inspect $imageName *> $null
    return $LASTEXITCODE -eq 0
}

function Get-DemoBuildFingerprint($repoRoot) {
    $trackedFiles = @(
        "docker-compose.yml",
        "app/backend/Dockerfile",
        "app/backend/requirements.txt",
        "app/backend/entrypoint.sh",
        "app/frontend/client-app/Dockerfile",
        "app/frontend/client-app/package.json",
        "app/frontend/client-app/package-lock.json",
        "app/frontend/backoffice-app/Dockerfile",
        "app/frontend/backoffice-app/package.json",
        "app/frontend/backoffice-app/package-lock.json"
    )

    $parts = foreach ($relativePath in $trackedFiles) {
        $path = Join-Path $repoRoot $relativePath
        if (Test-Path $path) {
            $hash = (Get-FileHash -Path $path -Algorithm SHA256).Hash
            "${relativePath}:${hash}"
        } else {
            "${relativePath}:missing"
        }
    }

    return ($parts -join "`n")
}

function Test-DemoBuildFingerprintChanged($repoRoot) {
    $fingerprintPath = Join-Path $repoRoot ".docker-demo-build.hash"
    $current = Get-DemoBuildFingerprint $repoRoot

    if (-not (Test-Path $fingerprintPath)) {
        return $true
    }

    $previous = Get-Content -Path $fingerprintPath -Raw
    return $previous.TrimEnd() -ne $current.TrimEnd()
}

function Save-DemoBuildFingerprint($repoRoot) {
    $fingerprintPath = Join-Path $repoRoot ".docker-demo-build.hash"
    Set-Content -Path $fingerprintPath -Value (Get-DemoBuildFingerprint $repoRoot) -Encoding ascii
}

function Get-ComposeUpArgs($services, [bool]$withBuild) {
    $args = @("compose", "up")
    if ($withBuild) {
        $args += "--build"
    }
    $args += "-d"
    $args += $services
    return $args
}

function Get-LanIp {
    $defaultRoute = Get-NetRoute -DestinationPrefix "0.0.0.0/0" |
        Sort-Object RouteMetric, InterfaceMetric |
        Select-Object -First 1

    if ($defaultRoute) {
        $address = Get-NetIPAddress -AddressFamily IPv4 -InterfaceIndex $defaultRoute.InterfaceIndex |
            Where-Object { $_.IPAddress -notlike "169.254.*" -and $_.IPAddress -ne "127.0.0.1" } |
            Select-Object -First 1
        if ($address) {
            return $address.IPAddress
        }
    }

    $fallback = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object { $_.IPAddress -notlike "169.254.*" -and $_.IPAddress -ne "127.0.0.1" } |
        Select-Object -First 1

    if (-not $fallback) {
        throw "No LAN IPv4 address found. Connect to Wi-Fi or Ethernet and retry."
    }

    return $fallback.IPAddress
}

function Get-EnvValue($path, $name) {
    if (-not (Test-Path $path)) {
        return ""
    }

    $line = Get-Content $path | Where-Object { $_ -match "^$name=" } | Select-Object -First 1
    if (-not $line) {
        return ""
    }

    return $line.Substring($name.Length + 1)
}

function Wait-Http($url, $label, [int]$TimeoutMinutes = 5) {
    $deadline = (Get-Date).AddMinutes($TimeoutMinutes)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                Write-Host "$label is ready: $url" -ForegroundColor Green
                return
            }
        } catch {
            Start-Sleep -Seconds 3
        }
    }

    throw "Timed out after $TimeoutMinutes minute(s) waiting for $label at $url"
}

function Show-DockerDiagnostics($services = @()) {
    Write-Host ""
    Write-Host "Docker diagnostics before cleanup:" -ForegroundColor Yellow

    try {
        & docker compose ps
    } catch {
        Write-Host "Unable to read docker compose service status: $($_.Exception.Message)" -ForegroundColor Red
    }

    try {
        $logArgs = @("compose", "logs", "--no-color", "--tail=200") + $services
        & docker @logArgs
    } catch {
        Write-Host "Unable to read docker compose logs: $($_.Exception.Message)" -ForegroundColor Red
    }
}

function Show-DemoQrPage($repoRoot, $clientUrl, $staffUrl) {
    try {
        $backofficeRoot = Join-Path $repoRoot "app/frontend/backoffice-app"
        $qrPackagePath = Join-Path $backofficeRoot "node_modules/qrcode.react"
        $reactPath = Join-Path $backofficeRoot "node_modules/react"

        if (-not (Test-Path $qrPackagePath) -or -not (Test-Path $reactPath)) {
            throw "QR dependencies are not installed in app/frontend/backoffice-app/node_modules."
        }

        $nodeVersion = & node --version 2>$null
        if ($LASTEXITCODE -ne 0 -or -not $nodeVersion) {
            throw "Node.js is not available."
        }

        $scriptPath = Join-Path $env:TEMP "tastify-demo-qr-page.js"
        $pagePath = Join-Path $env:TEMP "tastify-demo-qr-page.html"
        $script = @'
const fs = require("fs");
const path = require("path");

const [appRoot, clientUrl, staffUrl, pagePath] = process.argv.slice(2);
const React = require(path.join(appRoot, "node_modules", "react"));
const ReactDOMServer = require(path.join(appRoot, "node_modules", "react-dom", "server"));
const { QRCodeSVG } = require(path.join(appRoot, "node_modules", "qrcode.react"));

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderQr(url) {
  return ReactDOMServer.renderToStaticMarkup(
    React.createElement(QRCodeSVG, {
      value: url,
      size: 360,
      level: "M",
      includeMargin: true
    })
  );
}

const cards = [
  ["Client telephone", clientUrl],
  ["Staff telephone", staffUrl]
].map(([label, url]) => `
  <section class="card">
    <h2>${escapeHtml(label)}</h2>
    ${renderQr(url)}
    <p>${escapeHtml(url)}</p>
  </section>
`).join("");

const html = `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Tastify demo QR codes</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      font-family: Segoe UI, Arial, sans-serif;
      background: #f6f7f9;
      color: #111827;
      display: grid;
      place-items: center;
    }
    main {
      width: min(980px, calc(100vw - 40px));
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
      padding: 32px 0;
    }
    .card {
      background: white;
      border: 1px solid #d9dee7;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      box-shadow: 0 12px 30px rgba(17, 24, 39, 0.08);
    }
    h2 {
      margin: 0 0 16px;
      font-size: 24px;
      font-weight: 700;
    }
    svg {
      width: min(360px, 100%);
      height: auto;
      background: white;
    }
    p {
      margin: 16px 0 0;
      font-size: 18px;
      overflow-wrap: anywhere;
    }
  </style>
</head>
<body>
  <main>${cards}</main>
</body>
</html>`;

fs.writeFileSync(pagePath, html, "utf8");
'@

        Set-Content -Path $scriptPath -Value $script -Encoding ascii
        Invoke-Checked "node" @($scriptPath, $backofficeRoot, $clientUrl, $staffUrl, $pagePath) -Quiet
        Start-Process $pagePath
        Write-Host ""
        Write-Host "QR codes opened in the browser: $pagePath" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "QR code page could not be generated automatically: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "Use the telephone URLs above if needed." -ForegroundColor Yellow
    }
}

function Show-DemoSummary {
    Write-Host ""
    Write-Host "Tastify demo is ready" -ForegroundColor Green
    Write-Host ""
    Write-Host "URLs PC:" -ForegroundColor Yellow
    Write-Host "  Client:      $clientUrl"
    Write-Host "  Backoffice:  $staffUrl"
    Write-Host ""
    Write-Host "URLs telephone (meme Wi-Fi que le PC):" -ForegroundColor Yellow
    Write-Host "  Client:      $phoneClientUrl"
    Write-Host "  Staff:       $phoneStaffUrl"
    Show-DemoQrPage $repoRoot $phoneClientUrl $phoneStaffUrl
    Write-Host ""
    Write-Host "Comptes demo:" -ForegroundColor Yellow
    Write-Host "  Gerant/admin:  gerant_test     / password123"
    Write-Host "  Serveur:       serveur_test    / password123"
    Write-Host "  Cuisinier:     cuisinier_test  / password123"
    Write-Host "  Client:        client_test     / password123"
    Write-Host ""
    Write-Host "Quand la presentation est terminee, appuie sur Entree ici."
    Write-Host "Le script supprimera automatiquement les conteneurs et volumes Docker de demo." -ForegroundColor Cyan
}

function Stop-DemoStack {
    Write-Step "Stopping and cleaning Docker demo stack"
    Invoke-Checked "docker" @("compose", "down", "--volumes", "--remove-orphans") -Quiet
    Write-Host "Docker demo stack removed." -ForegroundColor Green
}

$cleanupOnExit = $false

try {
    $repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
    Set-Location $repoRoot

    Write-Step "Detecting LAN IP"
    $lanIp = Get-LanIp
    $clientUrl = "http://localhost:3003"
    $staffUrl = "http://localhost:3000"
    $phoneClientUrl = "http://${lanIp}:3003"
    $phoneStaffUrl = "http://${lanIp}:3000"

    Write-Host "PC LAN IP: $lanIp" -ForegroundColor Green

    Write-Step "Checking Docker Desktop"
    Invoke-Checked "docker" @("info", "--format", "{{.ServerVersion}}")

    Write-Step "Preparing local demo .env"
    $envPath = Join-Path $repoRoot ".env"
    $backupPath = Join-Path $repoRoot ".env.before-demo-local"
    $hfToken = Get-EnvValue $envPath "HUGGINGFACE_API_TOKEN"
    if (-not $hfToken -and (Test-Path $backupPath)) {
        $hfToken = Get-EnvValue $backupPath "HUGGINGFACE_API_TOKEN"
    }

    if ((Test-Path $envPath) -and -not (Test-Path $backupPath)) {
        Copy-Item $envPath $backupPath
        Write-Host "Existing .env backed up to .env.before-demo-local"
    }

    $envContent = @(
        "# Generated by start-demo-local.bat for the PFA local demo.",
        "SECRET_KEY=tastify-local-demo-secret-key",
        "DEBUG=True",
        "DJANGO_SETTINGS_MODULE=tastify_backend.settings.dev",
        "DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,backend,$lanIp",
        "FRONTEND_BASE_URL=$phoneClientUrl",
        "PASSWORD_RESET_TIMEOUT=3600",
        "",
        "MYSQL_DATABASE=tastify_db",
        "MYSQL_USER=tastify_user",
        "MYSQL_PASSWORD=tastify_pass",
        "MYSQL_ROOT_PASSWORD=rootpassword",
        "MYSQL_HOST=db",
        "MYSQL_PORT=3306",
        "",
        "REDIS_HOST=redis",
        "REDIS_PORT=6379",
        "CELERY_BROKER_URL=redis://redis:6379/1",
        "CELERY_RESULT_BACKEND=django-db",
        "CELERY_CACHE_BACKEND=django-cache",
        "",
        "VITE_API_BASE_URL=/api",
        "VITE_MEDIA_BASE_URL=",
        "VITE_WS_BASE_URL=",
        "VITE_STAFF_WS_PATH=/ws/staff/",
        "",
        "SEED_ON_STARTUP=1",
        "SEED_COMMAND=seed_all",
        "SEED_MEDIA_DOWNLOADS=1",
        "HUGGINGFACE_API_TOKEN=$hfToken"
    )

    Set-Content -Path $envPath -Value $envContent -Encoding ascii

    $buildFingerprintChanged = Test-DemoBuildFingerprintChanged $repoRoot
    $autoRebuild = $Rebuild -or $buildFingerprintChanged
    $backendNeedsBuild = $autoRebuild -or -not (Test-DockerImage "tastifypfa-backend-dev")
    $clientNeedsBuild = $autoRebuild -or -not (Test-DockerImage "tastifypfa-client-app")
    $backofficeNeedsBuild = $autoRebuild -or -not (Test-DockerImage "tastifypfa-backoffice-app")

    if ($Rebuild) {
        Write-Host "Rebuild requested. Building Docker images." -ForegroundColor Yellow
    } elseif ($buildFingerprintChanged) {
        Write-Host "Docker build files changed. Rebuilding images once." -ForegroundColor Yellow
    } elseif ($backendNeedsBuild -or $clientNeedsBuild -or $backofficeNeedsBuild) {
        Write-Host "Docker images missing. Building only what is needed." -ForegroundColor Yellow
    } else {
        Write-Host "Using cached Docker images. Code changes are mounted automatically." -ForegroundColor Green
    }

    Write-Step "Resetting Docker demo data"
    $cleanupOnExit = $true
    Invoke-Checked "docker" @("compose", "down", "--volumes", "--remove-orphans") -Quiet

    Write-Step "Starting database and cache"
    Invoke-Checked "docker" (Get-ComposeUpArgs -services @("db", "redis") -withBuild:$false) -Quiet

    Write-Step "Starting backend"
    Invoke-Checked "docker" (Get-ComposeUpArgs -services @("backend") -withBuild:$backendNeedsBuild) -Quiet

    Write-Step "Waiting for backend"
    Wait-Http "http://127.0.0.1:8000/api/health/" "Backend" 10

    Write-Step "Loading transactional demo data"
    Invoke-Checked "docker" @("compose", "exec", "-T", "backend", "python", "manage.py", "seed_transactions") -Quiet

    Write-Step "Starting frontend and background services"
    $frontendNeedsBuild = $clientNeedsBuild -or $backofficeNeedsBuild
    Invoke-Checked "docker" (Get-ComposeUpArgs -services @("client-app", "backoffice-app", "celery-worker", "celery-beat") -withBuild:$frontendNeedsBuild) -Quiet
    Save-DemoBuildFingerprint $repoRoot

    Write-Step "Waiting for web apps"
    Wait-Http "$staffUrl/" "Backoffice"
    Wait-Http "$clientUrl/" "Client portal"

    Write-Step "Opening browser pages"
    Start-Process $clientUrl
    Start-Process $staffUrl

    Show-DemoSummary
    [void](Read-Host)
} catch {
    if ($cleanupOnExit) {
        Show-DockerDiagnostics @("backend", "db", "redis", "client-app", "backoffice-app", "celery-worker", "celery-beat")
    }
    throw
} finally {
    if ($cleanupOnExit) {
        try {
            Stop-DemoStack
        } catch {
            Write-Host "Docker cleanup failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

