<#
    VOXY botni lokalda to'liq ishlaydigan holda ko'taradi.

    Nega kerak: Telegram Mini App faqat OCHIQ HTTPS manzilda ochiladi.
    Lokal `http://localhost:8000` ni Telegram qabul qilmaydi — shuning uchun
    cloudflared tunneli orqali vaqtinchalik https manzil olinadi va bot aynan
    shu manzilni tugmaga qo'yadi.

    Ishga tushirish (PowerShell, loyiha ildizidan):
        .\scripts\start-bot.ps1

    To'xtatish: Ctrl+C yoki .\scripts\stop-bot.ps1

    DIQQAT: bir vaqtda FAQAT BITTA bot polling qilishi mumkin. Render'da
    servis ishlab turgan bo'lsa, lokal botni ishga tushirmang — Telegram
    "Conflict" xatosini qaytaradi va ikkalasi ham javob bermay qoladi.
#>

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

$python = Join-Path $root ".venv\Scripts\python.exe"
$cloudflared = Join-Path $root "cloudflared.exe"
$logDir = Join-Path $root ".run"

if (-not (Test-Path $python)) { throw "Python virtual muhiti topilmadi: $python" }
if (-not (Test-Path $cloudflared)) {
    Write-Host "cloudflared yuklab olinmoqda..." -ForegroundColor Yellow
    Invoke-WebRequest -UseBasicParsing -TimeoutSec 180 `
        -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" `
        -OutFile $cloudflared
}
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }

# Eski jarayonlar qolib ketmasin: ikki polling = Telegram "Conflict".
Get-CimInstance Win32_Process -Filter "Name='python.exe' OR Name='cloudflared.exe'" |
    Where-Object { $_.CommandLine -match 'app\.main:app|app\.bot|trycloudflare|tunnel --url' } |
    ForEach-Object {
        Write-Host "eski jarayon to'xtatilmoqda: $($_.ProcessId)" -ForegroundColor DarkGray
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
Start-Sleep -Seconds 2

# 1. Tunnel
$tunnelLog = Join-Path $logDir "tunnel.log"
if (Test-Path $tunnelLog) { Remove-Item $tunnelLog -Force }
Write-Host "tunnel ochilmoqda..." -ForegroundColor Cyan
Start-Process -FilePath $cloudflared `
    -ArgumentList "tunnel","--url","http://localhost:8000","--no-autoupdate" `
    -RedirectStandardError $tunnelLog -RedirectStandardOutput (Join-Path $logDir "tunnel.out") `
    -WindowStyle Hidden

$publicUrl = $null
foreach ($attempt in 1..40) {
    Start-Sleep -Seconds 1
    if (Test-Path $tunnelLog) {
        $match = Select-String -Path $tunnelLog -Pattern "https://[a-z0-9-]+\.trycloudflare\.com" -ErrorAction SilentlyContinue |
                 Select-Object -First 1
        if ($match) { $publicUrl = $match.Matches[0].Value; break }
    }
}
if (-not $publicUrl) { throw "Tunnel manzili olinmadi. $tunnelLog faylini tekshiring." }
Write-Host "tunnel: $publicUrl" -ForegroundColor Green

# 2. Ovozli servis + bot (bot shu jarayon ichida, Render'dagi kabi)
$env:MINI_APP_URL = "$publicUrl/miniapp/"
$env:BACKEND_URL = $publicUrl
$env:RUN_BOT_IN_WEB = "true"
$env:APP_ENV = "development"

$serviceLog = Join-Path $logDir "voice.log"
Start-Process -FilePath $python `
    -ArgumentList "-m","uvicorn","app.main:app","--host","127.0.0.1","--port","8000" `
    -RedirectStandardError $serviceLog -RedirectStandardOutput (Join-Path $logDir "voice.out") `
    -WindowStyle Hidden

Write-Host "servis ko'tarilmoqda..." -ForegroundColor Cyan
$botLine = $null
foreach ($attempt in 1..30) {
    Start-Sleep -Seconds 1
    if (Test-Path $serviceLog) {
        $botLine = Select-String -Path $serviceLog -Pattern "Bot jarayon ichida ishlayapti" -ErrorAction SilentlyContinue |
                   Select-Object -First 1
        if ($botLine) { break }
    }
}

# 3. Tekshirish
try {
    $health = Invoke-WebRequest -UseBasicParsing -TimeoutSec 30 -Uri "$publicUrl/miniapp/"
    $miniAppOk = ($health.StatusCode -eq 200)
} catch { $miniAppOk = $false }

Write-Host ""
Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
if ($botLine) { Write-Host "  bot        : ishlayapti" -ForegroundColor Green }
else { Write-Host "  bot        : ISHGA TUSHMADI — $serviceLog ni ko'ring" -ForegroundColor Red }
if ($miniAppOk) { Write-Host "  mini app   : $publicUrl/miniapp/" -ForegroundColor Green }
else { Write-Host "  mini app   : OCHILMADI" -ForegroundColor Red }
Write-Host "  loglar     : $logDir" -ForegroundColor DarkGray
Write-Host "─────────────────────────────────────────────" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Telegramda @lockbridge_bot ga /start yuboring." -ForegroundColor White
Write-Host "Tunnel manzili har ishga tushirishda O'ZGARADI — bot uni o'zi oladi." -ForegroundColor DarkGray
