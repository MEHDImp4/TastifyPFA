param(
    [switch]$Rebuild
)

$ErrorActionPreference = "Stop"

function Write-Step($message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Cyan
}

function Invoke-Checked($command, $arguments, [switch]$Quiet) {
    if ($Quiet) {
        $output = & $command @arguments 2>&1
    } else {
        & $command @arguments
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

function Wait-Http($url, $label) {
    $deadline = (Get-Date).AddMinutes(5)
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

    throw "Timed out waiting for $label at $url"
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
    Wait-Http "http://127.0.0.1:8000/api/health/" "Backend"

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
} finally {
    if ($cleanupOnExit) {
        try {
            Stop-DemoStack
        } catch {
            Write-Host "Docker cleanup failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
