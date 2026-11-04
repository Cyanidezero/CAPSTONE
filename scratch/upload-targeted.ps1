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

$files = @(
    "version.json",
    "api/auth/login.php",
    "register.html",
    "farmer/login.html",
    "dev/login.html",
    "farmer/register.html",
    "dev/register.html",
    "farmer/asset-manifest.json",
    "dev/asset-manifest.json",
    "farmer/version.json",
    "dev/version.json",
    "farmer/static/js/main.9a1136c5.js",
    "farmer/static/js/main.9a1136c5.js.LICENSE.txt",
    "dev/static/js/main.a81b49cc.js",
    "dev/static/js/main.a81b49cc.js.LICENSE.txt"
)

foreach ($rel in $files) {
    $local = Join-Path $localRoot $rel
    if (Test-Path $local) {
        $rem = "$ftpHost/$rel".Replace('\', '/')
        Upload-FtpFile $local $rem
    }
}
Write-Host "Targeted role isolation upload complete!"
