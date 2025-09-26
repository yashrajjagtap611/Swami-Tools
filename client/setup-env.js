#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Setting up environment configuration...\n');

const envExamplePath = path.join(__dirname, '.env.example');
const envPath = path.join(__dirname, '.env');

// Check if .env.example exists
if (!fs.existsSync(envExamplePath)) {
  console.error('❌ .env.example file not found!');
  console.log('Please make sure you have the .env.example file in the client directory.');
  process.exit(1);
}

// Check if .env already exists
if (fs.existsSync(envPath)) {
  console.log('⚠️  .env file already exists.');
  console.log('If you want to recreate it, please delete the existing .env file first.\n');
  console.log('Current .env file contents:');
  console.log(fs.readFileSync(envPath, 'utf8'));
  process.exit(0);
}

try {
  // Copy .env.example to .env
  fs.copyFileSync(envExamplePath, envPath);
  
  console.log('✅ Successfully created .env file from .env.example');
  console.log('\n📝 Next steps:');
  console.log('1. Edit the .env file to match your configuration');
  console.log('2. Update VITE_API_URL with your server URL');
  console.log('3. Customize other settings as needed');
  console.log('\n🚀 Your environment is ready!');
  
} catch (error) {
  console.error('❌ Failed to create .env file:', error.message);
  process.exit(1);
}
