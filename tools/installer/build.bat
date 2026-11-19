@echo off
rem Збирає LORA-Installer.exe компілятором C#, що входить до Windows (.NET Framework 4.x).
cd /d "%~dp0"
set CSC=%WINDIR%\Microsoft.NET\Framework64\v4.0.30319\csc.exe
"%CSC%" /nologo /target:winexe /codepage:65001 /out:LORA-Installer.exe /win32icon:..\..\assets\lora.ico /r:System.IO.Compression.dll /r:System.IO.Compression.FileSystem.dll /r:System.Windows.Forms.dll /r:System.Drawing.dll LoraInstaller.cs
