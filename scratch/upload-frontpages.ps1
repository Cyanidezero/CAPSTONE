$ftpHost = "ftp://ftpupload.net/htdocs"
$ftpUser = "if0_43286056"
$ftpPass = "vWSxrmUFLhwHcO"
$localRoot = "c:\Users\User\Desktop\Climayield\htdocs"

$cred = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)

function Upload-FtpFile($localFile, $remoteUrl) {
    $retry = 0
    $success = $false
    while (-not $success -and $retry -lt 3) {
        try {
            $req = [System.Net.FtpWebRequest]::Create($remoteUrl)
            $req.Credentials = $cred
            $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
            $req.UseBinary = $true
            $req.UsePassive = $true
            $req.KeepAlive = $false
            $req.Timeout = 25000

            $fileBytes = [System.IO.File]::ReadAllBytes($localFile)
            $req.ContentLength = $fileBytes.Length

            $stream = $req.GetRequestStream()
            $stream.Write($fileBytes, 0, $fileBytes.Length)
            $stream.Close()

            $resp = $req.GetResponse()
            $resp.Close()
            $success = $true
            Write-Host "Uploaded: $localFile -> $remoteUrl"
        } catch {
            $retry++
            Write-Host "Retry $retry for $localFile ($($_.Exception.Message))"
            Start-Sleep -Seconds 2
        }
    }
}

$files = @(
    ".htaccess",
    "index.php",
    "farmer/login.html",
    "farmer/index.html",
    "dev/login.html",
    "dev/index.html"
)

foreach ($rel in $files) {
    $local = Join-Path $localRoot $rel
    if (Test-Path $local) {
        $rem = "$ftpHost/$rel".Replace('\', '/')
        Upload-FtpFile $local $rem
    }
}
Write-Host "Frontpages upload to InfinityFree complete!"

