@echo off

:: Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo NPM is not installed. Please install NPM and Node.js and try again.
    pause
    exit /b
)

echo Starting ComfyUIMini...
call npm start