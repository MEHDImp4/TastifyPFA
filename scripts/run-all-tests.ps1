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

function Test-CommandExists($command) {
    return $null -ne (Get-Command $command -ErrorAction SilentlyContinue)
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
    Wait-Http "http://127.0.0.1:8000/api/health/" "Backend"

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
} finally {
    if ($cleanupOnExit) {
        Stop-TestStack
    }
}
