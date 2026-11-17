@echo off
rem Project LORA: запускає локальний сервер (потрібен для Twitch, онлайну й OBS) і відкриває гру в браузері
cd /d "%~dp0"
start "Project LORA server" /min powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\serve.ps1"
