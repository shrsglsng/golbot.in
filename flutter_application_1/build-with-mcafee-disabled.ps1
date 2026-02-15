# Build Flutter APK with McAfee temporarily disabled
# This script will pause McAfee, build the APK, and re-enable McAfee

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Flutter APK Build with McAfee Pause" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "ERROR: This script requires administrator privileges to control McAfee." -ForegroundColor Red
    Write-Host "Please right-click and select 'Run as Administrator'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Function to check McAfee status
function Get-McAfeeStatus {
    $mcafeeProcess = Get-Process -Name "mcafee-security*" -ErrorAction SilentlyContinue
    if ($mcafeeProcess) {
        return "Running"
    } else {
        return "Stopped"
    }
}

# Function to disable McAfee Real-Time Scanning
function Disable-McAfee {
    Write-Host "Attempting to disable McAfee Web Protection..." -ForegroundColor Yellow
    try {
        # Try to stop McAfee services
        $services = @("McAfeeFramework", "mcapexe", "mfemms", "mfevtp")
        foreach ($service in $services) {
            $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
            if ($svc -and $svc.Status -eq "Running") {
                Write-Host "  Stopping $service..." -ForegroundColor Gray
                Stop-Service -Name $service -Force -ErrorAction SilentlyContinue
            }
        }
        Write-Host "McAfee services paused." -ForegroundColor Green
        return $true
    } catch {
        Write-Host "Could not automatically disable McAfee." -ForegroundColor Yellow
        Write-Host "Please manually disable McAfee Web Protection before continuing." -ForegroundColor Yellow
        Write-Host ""
        $response = Read-Host "Have you manually disabled McAfee? (Y/N)"
        if ($response -ne "Y" -and $response -ne "y") {
            Write-Host "Build cancelled." -ForegroundColor Red
            exit 1
        }
        return $false
    }
}

# Function to re-enable McAfee
function Enable-McAfee {
    Write-Host ""
    Write-Host "Re-enabling McAfee services..." -ForegroundColor Yellow
    try {
        $services = @("McAfeeFramework", "mcapexe", "mfemms", "mfevtp")
        foreach ($service in $services) {
            $svc = Get-Service -Name $service -ErrorAction SilentlyContinue
            if ($svc -and $svc.Status -eq "Stopped") {
                Write-Host "  Starting $service..." -ForegroundColor Gray
                Start-Service -Name $service -ErrorAction SilentlyContinue
            }
        }
        Write-Host "McAfee services re-enabled." -ForegroundColor Green
    } catch {
        Write-Host "Could not automatically re-enable McAfee." -ForegroundColor Yellow
        Write-Host "Please manually re-enable McAfee Web Protection." -ForegroundColor Yellow
    }
}

# Main script
try {
    Write-Host "Current McAfee Status: $(Get-McAfeeStatus)" -ForegroundColor Cyan
    Write-Host ""
    
    # Disable McAfee
    $mcafeeDisabled = Disable-McAfee
    Write-Host ""
    
    # Clear Gradle cache
    Write-Host "Clearing Gradle cache..." -ForegroundColor Yellow
    Remove-Item -Path "$env:USERPROFILE\.gradle\caches\modules-2" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "$env:USERPROFILE\.gradle\caches\transforms*" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Cache cleared." -ForegroundColor Green
    Write-Host ""
    
    # Wait a moment for services to fully stop
    Start-Sleep -Seconds 3
    
    # Build the APK
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Building Production APK..." -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $buildStartTime = Get-Date
    
    # Run Flutter build
    flutter build apk -t lib/main_prod.dart --flavor prod --release
    
    $buildEndTime = Get-Date
    $buildDuration = $buildEndTime - $buildStartTime
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "BUILD SUCCESSFUL!" -ForegroundColor Green
        Write-Host "Build time: $($buildDuration.ToString('mm\:ss'))" -ForegroundColor Green
        Write-Host "Output: build\app\outputs\flutter-apk\app-prod-release.apk" -ForegroundColor Green
    } else {
        Write-Host "BUILD FAILED!" -ForegroundColor Red
        Write-Host "Check the error messages above." -ForegroundColor Yellow
    }
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host "An error occurred: $_" -ForegroundColor Red
} finally {
    # Always try to re-enable McAfee
    if ($mcafeeDisabled) {
        Enable-McAfee
    }
    Write-Host ""
    Write-Host "Script completed. Press any key to exit..." -ForegroundColor Cyan
    pause
}
