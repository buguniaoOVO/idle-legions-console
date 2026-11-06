<#
  给每个游戏用户目录装上限帧钩子（cap.gd + autoload 行）。
  用法: powershell -ExecutionPolicy Bypass -File .\tools\install-cap.ps1
#>
$ErrorActionPreference = 'Stop'
$nl = [Environment]::NewLine
$capSrc = Join-Path (Split-Path $PSScriptRoot -Parent) 'helper\cap.gd'
if (-not (Test-Path $capSrc)) { throw "找不到 cap.gd：$capSrc" }
$line = 'IdleLegionsCap="*user://x1x_legions/cap.gd"'

# 注意：必须在游戏关闭时运行。游戏保存窗口位置时会重写 ventana_inicio.cfg，
# 如果那一刻钩子还没加载，IdleLegionsCap 这一行会被冲掉，所以先关游戏再跑这个脚本。
$running = @(Get-Process client -ErrorAction SilentlyContinue)
if ($running.Count -gt 0) {
  Write-Host ('警告：现在有 ' + $running.Count + ' 个游戏客户端在跑，先关掉再运行本脚本，否则那一行可能被游戏重写掉。')
}

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