#!/bin/bash

# Chech if git is installed
if ! command -v git &> /dev/null
then
    echo "Git is not installed. Please install git and try again or manually download the files from the repository and update manually."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "NPM is not installed. Please install NPM and Node.js and try again."
    exit 1
fi

echo "Downloading latest version..."
git pull
if [ $? -ne 0 ]; then
    echo "Failed to pull latest version. Please check your internet connection and try again."
    exit 1
fi

echo "Updating dependencies..."
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

echo "Update complete. Run the 'start.sh' script or the 'npm start' command to launch the app"