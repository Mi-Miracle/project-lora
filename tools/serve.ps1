# Локальний веб-сервер Project LORA (потрібен для входу через Twitch, онлайн-гри й джерела OBS). Зупинка — закрити вікно.
$root = Split-Path -Parent $PSScriptRoot
$port = 8642
$url = "http://localhost:$port/index.html"
$l = New-Object System.Net.HttpListener; $l.Prefixes.Add("http://localhost:$port/")
try { $l.Start() } catch { Write-Host "Сервер уже працює — відкриваю гру"; Start-Process $url; exit }
Write-Host "Project LORA: $url"
Write-Host "Не закривайте це вікно, поки граєте."
Start-Process $url
$types = @{ '.html'='text/html; charset=utf-8'; '.js'='application/javascript; charset=utf-8'; '.css'='text/css; charset=utf-8'; '.jpg'='image/jpeg'; '.png'='image/png'; '.json'='application/json'; '.ico'='image/x-icon'; '.svg'='image/svg+xml'; '.woff2'='font/woff2'; '.woff'='font/woff'; '.ttf'='font/ttf'; '.mp3'='audio/mpeg'; '.ogg'='audio/ogg'; '.webp'='image/webp' }
while ($l.IsListening) {
  try {
    $c = $l.GetContext(); $p = [Uri]::UnescapeDataString($c.Request.Url.AbsolutePath.TrimStart('/')); if (-not $p) { $p = 'index.html' }
    $f = Join-Path $root $p
    if ((Test-Path -LiteralPath $f -PathType Leaf) -and ((Resolve-Path -LiteralPath $f).Path.StartsWith($root))) { $b = [IO.File]::ReadAllBytes($f); $e = [IO.Path]::GetExtension($f).ToLower(); if ($types[$e]) { $c.Response.ContentType = $types[$e] }; $c.Response.Headers.Add('Cache-Control', 'no-cache'); $c.Response.OutputStream.Write($b, 0, $b.Length) } else { $c.Response.StatusCode = 404 }
    $c.Response.Close()
  } catch { }
}
