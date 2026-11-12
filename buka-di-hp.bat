@echo off
title Kalkulator Web Server
echo Memulai server kalkulator untuk HP...
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1"
pause
