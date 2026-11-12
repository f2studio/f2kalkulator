param(
    [int]$Port = 8080
)

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://*:$Port/")

try {
    $listener.Start()
} catch {
    Write-Host "Gagal membuka port $Port dengan wildcard, mencoba localhost..." -ForegroundColor Yellow
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$Port/")
    $listener.Start()
}

$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.IPAddress -notlike "169.254*" } | Select-Object -First 1).IPAddress
if (-not $ip) {
    $ip = "127.0.0.1"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  SERVER KALKULATOR AKTIF!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Buka di Browser HP (pastikan satu Wi-Fi dengan PC):" -ForegroundColor Yellow
Write-Host "   http://$($ip):$Port" -ForegroundColor White -BackgroundColor DarkGreen
Write-Host ""
Write-Host "💻 Buka di Browser Laptop/PC:" -ForegroundColor Cyan
Write-Host "   http://localhost:$Port" -ForegroundColor White
Write-Host ""
Write-Host "Tekan Ctrl+C di jendela ini untuk mematikan server." -ForegroundColor Gray
Write-Host "==========================================================" -ForegroundColor Cyan

$baseDir = $PSScriptRoot

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $urlPath = $request.Url.LocalPath.TrimStart('/')
    if ([string]::IsNullOrEmpty($urlPath)) {
        $urlPath = "index.html"
    }

    $filePath = Join-Path $baseDir $urlPath

    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = switch ($ext) {
            ".html" { "text/html; charset=utf-8" }
            ".css"  { "text/css; charset=utf-8" }
            ".js"   { "application/javascript; charset=utf-8" }
            ".png"  { "image/png" }
            ".jpg"  { "image/jpeg" }
            ".ico"  { "image/x-icon" }
            default { "application/octet-stream" }
        }

        $response.ContentType = $contentType
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
    } else {
        $response.StatusCode = 404
        $notFoundMsg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.OutputStream.Write($notFoundMsg, 0, $notFoundMsg.Length)
    }

    $response.OutputStream.Close()
}
