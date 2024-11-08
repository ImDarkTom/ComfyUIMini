#!/bin/bash
echo "Installing depenedencies"
npm install
echo "Building..."
npm run build
echo "Setup complete. Run 'npm start' to launch the app"
read -p "Press any key to exit..."