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
            $req.Timeout = 30000

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
    "config.php",
    ".htaccess",
    "api/alerts/sms_gateway.php",
    "api/crops_helper.php",
    "api/crops.php",
    "api/auth/forgot-password.php",
    "api/auth/signup.php",
    "register.html",
    "farmer/index.html",
    "farmer/login.html",
    "farmer/register.html",
    "farmer/asset-manifest.json",
    "farmer/version.json",
    "farmer/static/js/main.e6729292.js",
    "farmer/static/js/main.e6729292.js.LICENSE.txt",
    "farmer/static/css/main.badec62a.css",
    "dev/index.html",
    "dev/login.html",
    "dev/register.html",
    "dev/asset-manifest.json",
    "dev/version.json",
    "dev/static/js/main.ec7c9a4f.js",
    "dev/static/js/main.ec7c9a4f.js.LICENSE.txt",
    "dev/static/css/main.badec62a.css"
)

foreach ($rel in $files) {
    $local = Join-Path $localRoot $rel
    if (Test-Path $local) {
        $rem = "$ftpHost/$rel".Replace('\', '/')
        Upload-FtpFile $local $rem
    } else {
        Write-Host "Missing local file: $local"
    }
}

Write-Host "Complete upload finished successfully!"

