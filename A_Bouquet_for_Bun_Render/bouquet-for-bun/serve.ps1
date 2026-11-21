# Small local static-file server for Windows PowerShell 5.1+.
# Uses .NET's loopback TCP listener, so it needs no Node.js, Python, admin rights,
# or HTTP.sys URL reservation.
$ErrorActionPreference = 'Stop'
$root = [System.IO.Path]::GetFullPath($PSScriptRoot)
$rootPrefix = $root.TrimEnd([System.IO.Path]::DirectorySeparatorChar) + [System.IO.Path]::DirectorySeparatorChar
$port = 4173
$listener = $null

$contentTypes = @{
    '.html' = 'text/html; charset=utf-8'
    '.js'   = 'text/javascript; charset=utf-8'
    '.mjs'  = 'text/javascript; charset=utf-8'
    '.css'  = 'text/css; charset=utf-8'
    '.json' = 'application/json; charset=utf-8'
    '.svg'  = 'image/svg+xml'
    '.png'  = 'image/png'
    '.jpg'  = 'image/jpeg'
    '.jpeg' = 'image/jpeg'
    '.webp' = 'image/webp'
    '.woff' = 'font/woff'
    '.woff2'= 'font/woff2'
}

function Send-HttpResponse {
    param(
        [System.IO.Stream]$Stream,
        [int]$StatusCode,
        [string]$StatusText,
        [string]$ContentType,
        [byte[]]$Body,
        [bool]$HeadOnly = $false
    )
    $headerText = "HTTP/1.1 $StatusCode $StatusText`r`nContent-Type: $ContentType`r`nContent-Length: $($Body.Length)`r`nConnection: close`r`nCache-Control: no-cache`r`nX-Content-Type-Options: nosniff`r`n`r`n"
    $headerBytes = [System.Text.Encoding]::ASCII.GetBytes($headerText)
    $Stream.Write($headerBytes, 0, $headerBytes.Length)
    if (-not $HeadOnly -and $Body.Length -gt 0) {
        $Stream.Write($Body, 0, $Body.Length)
    }
    $Stream.Flush()
}

try {
    $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, $port)
    $listener.Start()
    Write-Host ''
    Write-Host 'Bouquet website is running:' -ForegroundColor Green
    Write-Host "  http://localhost:$port/" -ForegroundColor Cyan
    Write-Host ''
    Write-Host 'Keep this window open while viewing the website.'
    Write-Host 'Press Ctrl+C in this window to stop the website.'
    Start-Process "http://localhost:$port/"

    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
            $client.ReceiveTimeout = 5000
            $stream = $client.GetStream()
            $reader = [System.IO.StreamReader]::new($stream, [System.Text.Encoding]::ASCII, $false, 1024, $true)
            $requestLine = $reader.ReadLine()
            if ([string]::IsNullOrWhiteSpace($requestLine)) { continue }

            $requestParts = $requestLine.Split(' ')
            if ($requestParts.Length -lt 2) { continue }
            $method = $requestParts[0].ToUpperInvariant()
            $requestTarget = $requestParts[1]
            while ($true) {
                $headerLine = $reader.ReadLine()
                if ($null -eq $headerLine -or $headerLine -eq '') { break }
            }

            if ($method -ne 'GET' -and $method -ne 'HEAD') {
                $body = [System.Text.Encoding]::UTF8.GetBytes('Method not allowed')
                Send-HttpResponse -Stream $stream -StatusCode 405 -StatusText 'Method Not Allowed' -ContentType 'text/plain; charset=utf-8' -Body $body -HeadOnly ($method -eq 'HEAD')
                continue
            }

            try {
                $requestUri = [System.Uri]::new([System.Uri]::new("http://localhost:$port/"), $requestTarget)
                $urlPath = [System.Uri]::UnescapeDataString($requestUri.AbsolutePath)
                if ([string]::IsNullOrWhiteSpace($urlPath) -or $urlPath -eq '/') { $urlPath = '/index.html' }
                $relativePath = $urlPath.TrimStart('/').Replace('/', [System.IO.Path]::DirectorySeparatorChar)
                $target = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($root, $relativePath))

                if (-not $target.StartsWith($rootPrefix, [System.StringComparison]::OrdinalIgnoreCase)) {
                    throw 'Invalid path'
                }
                if (Test-Path -LiteralPath $target -PathType Container) {
                    $target = Join-Path $target 'index.html'
                }
                if (-not (Test-Path -LiteralPath $target -PathType Leaf)) {
                    $body = [System.Text.Encoding]::UTF8.GetBytes('Not found')
                    Send-HttpResponse -Stream $stream -StatusCode 404 -StatusText 'Not Found' -ContentType 'text/plain; charset=utf-8' -Body $body -HeadOnly ($method -eq 'HEAD')
                } else {
                    $body = [System.IO.File]::ReadAllBytes($target)
                    $extension = [System.IO.Path]::GetExtension($target).ToLowerInvariant()
                    $contentType = 'application/octet-stream'
                    if ($contentTypes.ContainsKey($extension)) { $contentType = $contentTypes[$extension] }
                    Send-HttpResponse -Stream $stream -StatusCode 200 -StatusText 'OK' -ContentType $contentType -Body $body -HeadOnly ($method -eq 'HEAD')
                }
            }
            catch {
                $body = [System.Text.Encoding]::UTF8.GetBytes('Bad request')
                Send-HttpResponse -Stream $stream -StatusCode 400 -StatusText 'Bad Request' -ContentType 'text/plain; charset=utf-8' -Body $body -HeadOnly ($method -eq 'HEAD')
            }
            $reader.Dispose()
        }
        catch {
            # Ignore an interrupted browser request and continue serving others.
        }
        finally {
            $client.Close()
        }
    }
}
catch [System.Net.Sockets.SocketException] {
    Write-Host ''
    Write-Host "Could not start the local server on port $port." -ForegroundColor Red
    Write-Host 'The port may already be in use. Close another copy of the bouquet website and try again.'
}
finally {
    if ($null -ne $listener) { $listener.Stop() }
}
