@echo off

:: Check if git is installed
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo Git is not installed. Please install git and try again or manually download the files from the repository and update manually.
    pause
    exit /b
)

:: Check if npm is installed
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo NPM is not installed. Please install NPM and Node.js and try again.
    pause
    exit /b
)

echo Downloading latest version...
call git pull
if %errorlevel% neq 0 (
    echo Failed to pull latest version. Please check your internet connection and try again.
    pause
    exit /b
)

echo Updating dependencies...
call npm install
if %errorlevel% neq 0 (
    echo Failed to update dependencies. Please check your internet connection and try again.
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

echo Update complete. Run the 'start.bat' script or the 'npm start' command to launch the app
pause