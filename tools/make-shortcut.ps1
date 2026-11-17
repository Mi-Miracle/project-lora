# Створює ярлик «Project LORA» на робочому столі (запуск сервера й гри)
$root = Split-Path -Parent $PSScriptRoot
$desk = [Environment]::GetFolderPath('Desktop')
$w = New-Object -ComObject WScript.Shell
$s = $w.CreateShortcut((Join-Path $desk 'Project LORA.lnk'))
$s.TargetPath = Join-Path $root 'Запустити LORA.bat'
$s.WorkingDirectory = $root
$s.IconLocation = (Join-Path $root 'assets\lora.ico') + ',0'
$s.WindowStyle = 7
$s.Description = 'Project LORA — геополітична стратегія'
$s.Save()
Write-Host "Ярлик створено: $desk\Project LORA.lnk"
