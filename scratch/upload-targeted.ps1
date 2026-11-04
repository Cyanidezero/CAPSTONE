$ftpHost = "ftp://ftpupload.net/htdocs"
$ftpUser = "if0_43286056"
$ftpPass = "vWSxrmUFLhwHcO"
$localRoot = "c:\Users\User\Desktop\Climayield\htdocs"

$cred = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)

function Ensure-FtpDir($remoteUrl) {
    try {
        $req = [System.Net.FtpWebRequest]::Create($remoteUrl)
        $req.Credentials = $cred
        $req.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $req.UsePassive = $true
        $req.KeepAlive = $false
        $req.Timeout = 15000
        $resp = $req.GetResponse()
        $resp.Close()
    } catch {}
}

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

Ensure-FtpDir "$ftpHost/api/alerts"

$files = @(
    "config.php",
    "version.json",
    "api/alerts/sms_gateway.php",
    "api/auth/forgot-password.php",
    "farmer/login.html",
    "dev/login.html",
    "farmer/asset-manifest.json",
    "dev/asset-manifest.json",
    "farmer/version.json",
    "dev/version.json",
    "farmer/static/js/main.fb99a9a1.js",
    "farmer/static/js/main.fb99a9a1.js.LICENSE.txt",
    "dev/static/js/main.2a2c0ab3.js",
    "dev/static/js/main.2a2c0ab3.js.LICENSE.txt"
)

foreach ($rel in $files) {
    $local = Join-Path $localRoot $rel
    if (Test-Path $local) {
        $rem = "$ftpHost/$rel".Replace('\', '/')
        Upload-FtpFile $local $rem
    }
}
Write-Host "Targeted upload complete!"
