#!/bin/bash

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "NPM is not installed. Please install NPM and Node.js and try again."
    exit 1
fi

echo "Installing dependencies"
npm install
if [ $? -ne 0 ]; then
    echo "Failed to update dependencies. Please check your internet connection and try again."
    exit 1
fi

echo "Building..."
npm run build
if [ $? -ne 0 ]; then
    echo "Build failed. Check the console for more information."
    exit 1
fi

echo "Setup complete. Run the 'start.sh' script or the 'npm start' command to launch the app"
read -p "Press any key to exit..."