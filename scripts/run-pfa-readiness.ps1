param(
    [switch]$SkipFullSuite,
    [switch]$SkipCrossApp,
    [switch]$SkipMatrix
)

$ErrorActionPreference = "Stop"
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$reportDir = Join-Path $repoRoot "output"
$reportPath = Join-Path $reportDir "pfa-test-readiness-$timestamp.md"
$results = New-Object System.Collections.Generic.List[object]

function Write-Step($message) {
    Write-Host ""
    Write-Host "==> $message" -ForegroundColor Cyan
}

function Add-Result($name, $status, $duration, $command, $note = "") {
    $results.Add([pscustomobject]@{
        Name = $name
        Status = $status
        Duration = $duration
        Command = $command
        Note = $note
    }) | Out-Null
}

function Invoke-ReadinessStep($name, $command, $arguments) {
    $startedAt = Get-Date
    $commandLine = "$command $($arguments -join ' ')"
    Write-Step $name
    Write-Host $commandLine -ForegroundColor DarkGray

    Push-Location $repoRoot
    try {
        & $command @arguments
        if ($LASTEXITCODE -ne 0) {
            throw "$commandLine failed with exit code $LASTEXITCODE"
        }
        $duration = [int]((Get-Date) - $startedAt).TotalSeconds
        Add-Result $name "PASS" $duration $commandLine
        Write-Host "PASS ($duration s)" -ForegroundColor Green
    } catch {
        $duration = [int]((Get-Date) - $startedAt).TotalSeconds
        Add-Result $name "FAIL" $duration $commandLine $_.Exception.Message
        throw
    } finally {
        Pop-Location
    }
}

New-Item -ItemType Directory -Force -Path $reportDir | Out-Null

try {
    if (-not $SkipFullSuite) {
        Invoke-ReadinessStep "Full local suite with rebuild" "powershell" @(
            "-NoProfile",
            "-ExecutionPolicy", "Bypass",
            "-File", (Join-Path $repoRoot "scripts\run-all-tests.ps1"),
            "-Rebuild"
        )
    } else {
        Add-Result "Full local suite with rebuild" "SKIP" 0 ".\scripts\run-all-tests.ps1 -Rebuild" "Skipped by -SkipFullSuite."
    }

    if (-not $SkipCrossApp) {
        Invoke-ReadinessStep "Cross-app jury scenarios" "npm" @("run", "test:e2e:cross-app")
    } else {
        Add-Result "Cross-app jury scenarios" "SKIP" 0 "npm run test:e2e:cross-app" "Skipped by -SkipCrossApp."
    }

    if (-not $SkipMatrix) {
        Invoke-ReadinessStep "Responsive/browser matrix smoke" "npm" @("run", "test:e2e:matrix")
    } else {
        Add-Result "Responsive/browser matrix smoke" "SKIP" 0 "npm run test:e2e:matrix" "Skipped by -SkipMatrix."
    }
} finally {
    $now = Get-Date -Format "yyyy-MM-dd HH:mm:ss zzz"
    $lines = @(
        "# PFA test readiness report",
        "",
        "- Date: $now",
        "- Machine: $env:COMPUTERNAME",
        "- Repo: $repoRoot",
        "",
        "| Suite | Status | Duration | Command | Note |",
        "| --- | --- | ---: | --- | --- |"
    )

    foreach ($result in $results) {
        $safeNote = ($result.Note -replace "\|", "\|") -replace "`r?`n", " "
        $safeCommand = ($result.Command -replace "\|", "\|")
        $lines += "| $($result.Name) | $($result.Status) | $($result.Duration)s | ``$safeCommand`` | $safeNote |"
    }

    $lines += @(
        "",
        "## Lecture rapide",
        "",
        "- PASS: suite validee pour une repetition PFA.",
        "- FAIL: corriger le premier echec avant de refaire une repetition complete.",
        "- SKIP: option volontaire, a eviter pour la validation finale."
    )

    Set-Content -Path $reportPath -Value $lines -Encoding UTF8
    Write-Host ""
    Write-Host "Readiness report: $reportPath" -ForegroundColor Yellow
}
