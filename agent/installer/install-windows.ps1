# HypeRemote Agent Installer for Windows
# Usage: .\install-windows.ps1 -UserID "user-id-here" -DeviceName "My-PC"

param(
    [Parameter(Mandatory=$true)]
    [string]$UserID,
    
    [Parameter(Mandatory=$false)]
    [string]$DeviceName = $env:COMPUTERNAME
)

$ErrorActionPreference = "Stop"

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  HypeRemote Agent Installer" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$InstallDir = "$env:ProgramFiles\HypeRemote"
$AgentUrl = "https://github.com/JessiJC44/HypeRMM/releases/latest/download/hyperemote-agent-windows.exe"
$ServiceName = "HypeRemoteAgent"

# Create install directory
Write-Host "[1/5] Creating installation directory..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
New-Item -ItemType Directory -Force -Path "$env:ProgramData\HypeRemote" | Out-Null

# Download agent
Write-Host "[2/5] Downloading HypeRemote Agent..." -ForegroundColor Yellow
$AgentPath = "$InstallDir\hyperemote-agent.exe"
Invoke-WebRequest -Uri $AgentUrl -OutFile $AgentPath

# Create config
Write-Host "[3/5] Creating configuration..." -ForegroundColor Yellow
$Config = @{
    user_id = $UserID
    device_id = ""
    flux_id = ""
} | ConvertTo-Json
$Config | Out-File -FilePath "$env:ProgramData\HypeRemote\config.json" -Encoding UTF8

# Install as Windows Service
Write-Host "[4/5] Installing Windows Service..." -ForegroundColor Yellow
& sc.exe create $ServiceName binPath= "`"$AgentPath`" $UserID `"$DeviceName`"" start= auto
& sc.exe description $ServiceName "HypeRemote Remote Monitoring Agent"
& sc.exe start $ServiceName

# Verify
Write-Host "[5/5] Verifying installation..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
$Service = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
if ($Service -and $Service.Status -eq "Running") {
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "  Installation Complete!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Device Name: $DeviceName" -ForegroundColor White
    Write-Host "User ID: $UserID" -ForegroundColor White
    Write-Host "Status: Running" -ForegroundColor Green
    Write-Host ""
    Write-Host "The device will appear in your HypeRemote dashboard shortly."
} else {
    Write-Host "Service installation may have failed. Check Event Viewer for details." -ForegroundColor Red
}
