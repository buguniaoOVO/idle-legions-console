<#
  给每个游戏用户目录装上限帧钩子（cap.gd + autoload 行）。
  用法: powershell -ExecutionPolicy Bypass -File .\tools\install-cap.ps1
#>
$ErrorActionPreference = 'Stop'
$nl = [Environment]::NewLine
$capSrc = Join-Path (Split-Path $PSScriptRoot -Parent) 'helper\cap.gd'
if (-not (Test-Path $capSrc)) { throw "找不到 cap.gd：$capSrc" }
$line = 'IdleLegionsCap="*user://x1x_legions/cap.gd"'

$targets = @((Join-Path $env:APPDATA 'Godot\app_userdata\Idle Legions'))
$sandboxRoot = 'D:\Sandbox'
if (Test-Path $sandboxRoot) {
  # 结构：D:\Sandbox\<用户>\<沙盘>\user\current\AppData\Roaming\Godot\...
  Get-ChildItem $sandboxRoot -Directory | ForEach-Object {
    Get-ChildItem $_.FullName -Directory -ErrorAction SilentlyContinue | ForEach-Object {
      $targets += (Join-Path $_.FullName 'user\current\AppData\Roaming\Godot\app_userdata\Idle Legions')
    }
  }
}

foreach ($t in $targets) {
  if (-not (Test-Path $t)) { continue }
  $dir = Join-Path $t 'x1x_legions'
  if (-not (Test-Path $dir)) { continue }
  Copy-Item $capSrc (Join-Path $dir 'cap.gd') -Force
  $cfg = Join-Path $t 'ventana_inicio.cfg'
  $text = if (Test-Path $cfg) { [IO.File]::ReadAllText($cfg) } else { '' }
  if ($text -notmatch 'x1x_legions/cap\.gd') {
    if ($text -match '\[autoload\]') {
      $text = $text.Replace('[autoload]', ('[autoload]' + $nl + $nl + $line))
    } else {
      $text = $text.TrimEnd() + $nl + $nl + '[autoload]' + $nl + $nl + $line + $nl
    }
    [IO.File]::WriteAllText($cfg, $text, (New-Object Text.UTF8Encoding($false)))
  }
  Write-Host ('已装：' + $t)
}
