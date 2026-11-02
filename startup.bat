@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0control-rpc.ps1" enable-startup
pause
