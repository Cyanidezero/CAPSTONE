$ftpHost = "ftp://ftpupload.net/htdocs"
$ftpUser = "if0_43286056"
$ftpPass = "vWSxrmUFLhwHcO"
$cred = New-Object System.Net.NetworkCredential($ftpUser, $ftpPass)

function Upload-FtpFile($localFile, $remoteUrl) {
    try {
        $req = [System.Net.FtpWebRequest]::Create($remoteUrl)
        $req.Credentials = $cred
        $req.Method = [System.Net.WebRequestMethods+Ftp]::UploadFile
        $req.UseBinary = $true
        $req.UsePassive = $true
        $req.KeepAlive = $false
        $fileBytes = [System.IO.File]::ReadAllBytes($localFile)
        $req.ContentLength = $fileBytes.Length
        $stream = $req.GetRequestStream()
        $stream.Write($fileBytes, 0, $fileBytes.Length)
        $stream.Close()
        $resp = $req.GetResponse()
        $resp.Close()
        Write-Host "Uploaded: $localFile -> $remoteUrl"
    } catch {
        Write-Host "Error uploading $localFile : $($_.Exception.Message)"
    }
}

Upload-FtpFile "c:\Users\User\Desktop\Climayield\htdocs\config.local.php" "$ftpHost/config.local.php"
Upload-FtpFile "c:\Users\User\Desktop\Climayield\htdocs\config.php" "$ftpHost/config.php"
Upload-FtpFile "c:\Users\User\Desktop\Climayield\htdocs\api\alerts\email_gateway.php" "$ftpHost/api/alerts/email_gateway.php"

