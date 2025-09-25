@echo off
echo Starting Cookie Admin Server...
echo.

REM Check if .env file exists
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please copy env.example to .env and configure your settings
    echo.
    echo Example:
    echo   copy env.example .env
    echo   notepad .env
    echo.
    pause
    exit /b 1
)

REM Check if MongoDB is running
echo Checking MongoDB connection...
node -e "
const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cookie_admin')
  .then(() => {
    console.log('✅ MongoDB is accessible');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ MongoDB connection failed:', err.message);
    console.log('💡 Make sure MongoDB is running on your system');
    process.exit(1);
  });
"

if %errorlevel% neq 0 (
    echo.
    echo MongoDB connection failed. Please start MongoDB first.
    pause
    exit /b 1
)

echo.
echo Starting server...
npm run dev
