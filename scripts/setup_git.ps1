$ErrorActionPreference = "Stop"
$destDir = "$env:LOCALAPPDATA\Programs\Git"
if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$zipUrl = "https://github.com/git-for-windows/git/releases/download/v2.47.0.windows.1/MinGit-2.47.0-64-bit.zip"
$zipPath = "$env:TEMP\mingit.zip"

Write-Host "1. Downloading MinGit..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath

Write-Host "2. Extracting MinGit..."
Expand-Archive -Path $zipPath -DestinationPath $destDir -Force

Write-Host "3. Cleaning up temp files..."
Remove-Item -Path $zipPath -Force

Write-Host "4. Updating User PATH..."
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
$gitCmd = "$destDir\cmd"
if ($userPath -notlike "*$gitCmd*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$gitCmd", "User")
}

Write-Host "MinGit successfully installed!"
& "$gitCmd\git.exe" --version
