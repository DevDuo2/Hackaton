<#
    Lokal VOXY botni va tunnelni to'xtatadi.

    Render'ga deploy qilishdan OLDIN buni ishga tushiring: ikki joyda bir
    vaqtda polling qilib bo'lmaydi, Telegram "Conflict" qaytaradi va bot
    ikkala joyda ham javob bermay qoladi.
#>

$stopped = 0
Get-CimInstance Win32_Process -Filter "Name='python.exe' OR Name='cloudflared.exe'" |
    Where-Object { $_.CommandLine -match 'app\.main:app|app\.bot|trycloudflare|tunnel --url' } |
    ForEach-Object {
        Write-Host "to'xtatildi: $($_.ProcessId)  $($_.Name)" -ForegroundColor DarkGray
        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
        $stopped++
    }

if ($stopped -eq 0) { Write-Host "ishlayotgan jarayon topilmadi." -ForegroundColor Yellow }
else { Write-Host "$stopped ta jarayon to'xtatildi." -ForegroundColor Green }
