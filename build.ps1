<#
  把 console-src 里的前端资源、窗口标题和图标写回一个 PyInstaller 单文件 exe。
  用法:  .\build.ps1 [-Source <原始 exe>] [-Out <输出 exe>]
  默认从 IL\X1X中控台.exe.orig-20261106 出发，产出 IL\X1X中控台.exe。
#>
param(
  [string]$Source = (Join-Path $PSScriptRoot '..\X1X中控台.exe.orig-20261106'),
  [string]$Out    = (Join-Path $PSScriptRoot '..\Idle Legions 多开中控.exe')
)
$ErrorActionPreference = 'Stop'
$py = (Get-Command python).Source
$work = Join-Path $env:TEMP 'x1x-build'
New-Item -ItemType Directory -Path $work -Force | Out-Null
$stage1 = Join-Path $work 'stage1.exe'
$stage2 = Join-Path $work 'stage2.exe'
$stage3 = Join-Path $work 'stage3.exe'

Write-Host '1/3 打补丁：窗口标题常量'
& $py (Join-Path $PSScriptRoot 'tools\patch_main.py') $Source $stage1 'X1X 中控台' 'Idle Legions 多开中控'
if ($LASTEXITCODE -ne 0) { throw 'patch_main 失败' }

Write-Host '2/3 打包前端资源'
& $py (Join-Path $PSScriptRoot 'tools\repack.py') $stage1 $stage2 $PSScriptRoot
if ($LASTEXITCODE -ne 0) { throw 'repack 失败' }

Write-Host '3/3 写入图标'
Copy-Item $stage2 $stage3 -Force
$icon = Join-Path $PSScriptRoot 'assets\icon\icon-256.png'
if (-not (Test-Path $icon)) { $icon = Join-Path $PSScriptRoot '..\icon-work\icon-256.png' }
Copy-Item $icon (Join-Path $work 'icon.png') -Force
& $py (Join-Path $PSScriptRoot 'tools\patch_icon.py') $stage3 (Join-Path $work 'icon.png')
if ($LASTEXITCODE -ne 0) { throw 'patch_icon 失败' }

Copy-Item $stage3 $Out -Force
Write-Host ('完成：' + $Out)