param(
    [switch]$E2E,
    [switch]$SkipE2E,
    [switch]$Rebuild,
    [switch]$KeepRunning
)

$ErrorActionPreference = "Stop"
$results = New-Object System.Collections.Generic.List[object]
$cleanupOnExit = $false
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$runE2E = -not $SkipE2E

function Write-Step($message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Cyan
}

function Invoke-Checked($label, $command, $arguments, $workdir = $repoRoot) {
    $startedAt = Get-Date
    Write-Step $label

    Push-Location $workdir
    try {
        & $command @arguments
        if ($LASTEXITCODE -ne 0) {
            throw "$command $($arguments -join ' ') failed with exit code $LASTEXITCODE"
        }
    } finally {
        Pop-Location
    }

    $duration = [int]((Get-Date) - $startedAt).TotalSeconds
    $results.Add([pscustomobject]@{ Name = $label; Duration = $duration }) | Out-Null
    Write-Host "OK ($duration s)" -ForegroundColor Green
}

function Invoke-NativeQuiet($command, $arguments) {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        $output = & $command @arguments 2>&1
        $exitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }

    if ($exitCode -ne 0) {
        if ($output) {
            $output | Select-Object -Last 80 | ForEach-Object { Write-Host $_ }
        }
        throw "$command $($arguments -join ' ') failed with exit code $exitCode"
    }
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

function Test-CommandExists($command) {
    return $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
}

function Test-DockerImageExists($image) {
    $previousErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & docker image inspect $image *> $null
        return $LASTEXITCODE -eq 0
    } finally {
        $ErrorActionPreference = $previousErrorActionPreference
    }
}

function Assert-RebuildBaseImagesAvailable {
    if (-not $Rebuild) {
        return
    }

    $requiredBaseImages = @(
        "python:3.12-slim",
        "node:22-alpine"
    )
    $missingBaseImages = @($requiredBaseImages | Where-Object { -not (Test-DockerImageExists $_) })

    if ($missingBaseImages.Count -gt 0) {
        $imageList = $missingBaseImages -join ", "
        throw @"
Cannot run -Rebuild because Docker is missing required base image(s): $imageList.

Docker must be able to resolve and pull missing base images from Docker Hub before a full rebuild.
Fix Docker Desktop DNS/proxy/internet access, then run:
  docker pull $($missingBaseImages -join "`n  docker pull ")

For an offline rehearsal that uses existing app images, run without -Rebuild or use:
  run-pfa-readiness.bat -SkipFullSuite
"@
    }
}

function Stop-TestStack {
    if ($KeepRunning) {
        Write-Host "Keeping Docker test stack running because -KeepRunning was used." -ForegroundColor Yellow
        return
    }

    Write-Step "Cleaning Docker test stack"
    try {
        Invoke-NativeQuiet "docker" @("compose", "down", "--volumes", "--remove-orphans")
    } catch {
        Write-Host "Docker cleanup failed. You can run: docker compose down --volumes --remove-orphans" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        return
    }

    Write-Host "Docker test stack removed." -ForegroundColor Green
}

try {
    Set-Location $repoRoot

    if (-not (Test-CommandExists "docker")) {
        throw "Docker is not available in PATH."
    }
    if (-not (Test-CommandExists "npm")) {
        throw "npm is not available in PATH."
    }

    Invoke-Checked "Docker Desktop available" "docker" @("info", "--format", "{{.ServerVersion}}")
    Assert-RebuildBaseImagesAvailable

    Write-Step "Starting backend test services"
    $cleanupOnExit = $true
    Invoke-NativeQuiet "docker" @("compose", "down", "--volumes", "--remove-orphans")
    if ($Rebuild) {
        & docker compose up --build -d db redis backend
    } else {
        & docker compose up -d db redis backend
    }
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose up failed"
    }
    Wait-Http "http://127.0.0.1:8000/api/health/" "Backend" 10

    Invoke-Checked "Django system checks" "docker" @(
        "compose", "exec", "-T",
        "-e", "DJANGO_SETTINGS_MODULE=tastify_backend.settings.test",
        "backend", "python", "manage.py", "check"
    )

    Invoke-Checked "Backend pytest suite" "docker" @(
        "compose", "exec", "-T",
        "-e", "DJANGO_SETTINGS_MODULE=tastify_backend.settings.test",
        "backend", "python", "-m", "pytest", "-q"
    )

    Invoke-Checked "Backoffice typecheck" "npm" @("--prefix", "app/frontend/backoffice-app", "run", "typecheck")
    Invoke-Checked "Client typecheck" "npm" @("--prefix", "app/frontend/client-app", "run", "typecheck")

    Invoke-Checked "Backoffice unit tests" "npm" @("--prefix", "app/frontend/backoffice-app", "run", "test:unit")
    Invoke-Checked "Client unit tests" "npm" @("--prefix", "app/frontend/client-app", "run", "test:unit")

    Invoke-Checked "Backoffice production build" "npm" @("--prefix", "app/frontend/backoffice-app", "run", "build")
    Invoke-Checked "Client production build" "npm" @("--prefix", "app/frontend/client-app", "run", "build")

    if ($runE2E) {
        Write-Step "Starting browser test services"
        if ($Rebuild) {
            & docker compose up --build -d client-app backoffice-app celery-worker celery-beat
        } else {
            & docker compose up -d client-app backoffice-app celery-worker celery-beat
        }
        if ($LASTEXITCODE -ne 0) {
            throw "docker compose up for E2E services failed"
        }

        Wait-Http "http://127.0.0.1:3000/" "Backoffice"
        Wait-Http "http://127.0.0.1:3003/" "Client"

        Invoke-Checked "Backoffice E2E tests" "npm" @("--prefix", "app/frontend/backoffice-app", "run", "test:e2e")
        Invoke-Checked "Client E2E tests" "npm" @("--prefix", "app/frontend/client-app", "run", "test:e2e")
    } else {
        Write-Host ""
        Write-Host "E2E browser tests skipped because -SkipE2E was used." -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "All requested Tastify tests passed." -ForegroundColor Green
    Write-Host ""
    Write-Host "Summary:" -ForegroundColor Yellow
    foreach ($result in $results) {
        Write-Host ("  {0} - {1}s" -f $result.Name, $result.Duration)
    }
} catch {
    if ($cleanupOnExit) {
        Show-DockerDiagnostics @("backend", "db", "redis", "client-app", "backoffice-app")
    }
    throw
} finally {
    if ($cleanupOnExit) {
        Stop-TestStack
    }
}
