$ErrorActionPreference = "Stop"
$destDir = "$env:LOCALAPPDATA\Programs\nodejs"
if (!(Test-Path $destDir)) {
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
}

$zipUrl = "https://nodejs.org/dist/v20.18.0/node-v20.18.0-win-x64.zip"
$zipPath = "$env:TEMP\node.zip"
$extractPath = "$env:TEMP\node_temp"

Write-Host "1. Downloading Node.js v20.18.0..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $zipUrl -OutFile $zipPath

Write-Host "2. Extracting Node.js..."
if (Test-Path $extractPath) { Remove-Item -Path $extractPath -Recurse -Force }
Expand-Archive -Path $zipPath -DestinationPath $extractPath -Force

Write-Host "3. Installing to $destDir..."
Copy-Item -Path "$extractPath\node-v20.18.0-win-x64\*" -Destination $destDir -Recurse -Force

Write-Host "4. Cleaning up temp files..."
Remove-Item -Path $zipPath -Force
Remove-Item -Path $extractPath -Recurse -Force

Write-Host "5. Updating User PATH..."
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($userPath -notlike "*$destDir*") {
    [Environment]::SetEnvironmentVariable("Path", "$userPath;$destDir", "User")
}

Write-Host "Successfully installed Node.js!"
& "$destDir\node.exe" -v
& "$destDir\npm.cmd" -v

