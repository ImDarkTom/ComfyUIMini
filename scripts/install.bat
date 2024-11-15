@echo off

:: Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo NPM is not installed. Please install NPM and Node.js and try again.
    pause
    exit /b
)

echo Installing dependencies
call npm install
if %errorlevel% neq 0 (
    echo Failed to install dependencies. Please check your internet connection and try again.
    pause
    exit /b
)

echo Building...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed. Check the output for more information.
    pause
    exit /b
)

echo Setup complete. Run the 'start.bat' script or the 'npm start' command to launch the app
pause