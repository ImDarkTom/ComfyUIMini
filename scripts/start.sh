#!/bin/bash

# Check if npm is installed
if ! command -v npm &> /dev/null
then
    echo "NPM is not installed. Please install NPM and Node.js and try again."
    exit 1
fi

echo "Starting ComfyUIMini..."
npm start