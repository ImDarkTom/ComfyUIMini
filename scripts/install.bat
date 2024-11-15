@echo off
echo Installing dependencies
call npm install
echo Building...
call npm run build
echo Setup complete. Run 'npm start' to launch the app
pause