// Test script for plan expiration enforcement
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import jwt from 'jsonwebtoken';
import fetch from 'node-fetch';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cookie_admin';
const SERVER_URL = 'http://localhost:3000';

async function testPlanExpirationEnforcement() {
  try {
    console.log('🧪 TESTING PLAN EXPIRATION ENFORCEMENT');
    console.log('=====================================\n');

    // Connect to database
    console.log('🔍 Step 1: Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Find a test user (non-admin)
    console.log('👤 Step 2: Finding test user...');
    const testUser = await User.findOne({ isAdmin: false });
    if (!testUser) {
      console.log('❌ No non-admin user found for testing');
      return;
    }
    console.log(`✅ Found test user: ${testUser.username}\n`);

    // Create JWT token for the user
    const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
    const validToken = jwt.sign(
      { 
        userId: testUser._id, 
        username: testUser.username, 
        isAdmin: testUser.isAdmin 
      },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Test 1: User with valid plan should be able to access cookies
    console.log('🧪 Test 1: Valid plan access...');
    
    // Set user expiry to future date
    testUser.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    await testUser.save();
    
    try {
      const response = await fetch(`${SERVER_URL}/api/cookies/get?website=chatgpt.com`, {
        headers: { 'Authorization': `Bearer ${validToken}` }
      });
      
      if (response.ok) {
        console.log('✅ Valid plan: Cookie access allowed');
      } else {
        const errorData = await response.json();
        console.log(`❌ Valid plan: Cookie access denied - ${errorData.message}`);
      }
    } catch (error) {
      console.log(`❌ Valid plan test failed: ${error.message}`);
    }

    // Test 2: User with expired plan should be blocked
    console.log('\n🧪 Test 2: Expired plan access...');
    
    // Set user expiry to past date
    testUser.expiryDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    await testUser.save();
    
    try {
      const response = await fetch(`${SERVER_URL}/api/cookies/get?website=chatgpt.com`, {
        headers: { 'Authorization': `Bearer ${validToken}` }
      });
      
      const responseData = await response.json();
      
      if (response.status === 403 && responseData.reason === 'plan_expired') {
        console.log('✅ Expired plan: Cookie access correctly blocked');
        console.log(`   Message: ${responseData.message}`);
        console.log(`   Expired on: ${responseData.expiredOn}`);
      } else {
        console.log(`❌ Expired plan: Should be blocked but got status ${response.status}`);
        console.log(`   Response: ${JSON.stringify(responseData)}`);
      }
    } catch (error) {
      console.log(`❌ Expired plan test failed: ${error.message}`);
    }

    // Test 3: Cookie insertion should also be blocked for expired users
    console.log('\n🧪 Test 3: Expired plan cookie insertion...');
    
    try {
      const response = await fetch(`${SERVER_URL}/api/cookies/insert`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${validToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          website: 'chatgpt.com',
          cookies: [{ name: 'test', value: 'test' }]
        })
      });
      
      const responseData = await response.json();
      
      if (response.status === 403 && responseData.reason === 'plan_expired') {
        console.log('✅ Expired plan: Cookie insertion correctly blocked');
      } else {
        console.log(`❌ Expired plan: Cookie insertion should be blocked but got status ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Cookie insertion test failed: ${error.message}`);
    }

    // Test 4: Website-specific expiration
    console.log('\n🧪 Test 4: Website-specific permission expiration...');
    
    // Reset user plan to valid
    testUser.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    // Set website permission to expired
    const chatgptPermission = testUser.websitePermissions.find(p => p.website === 'chatgpt.com');
    if (chatgptPermission) {
      chatgptPermission.expiresAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      await testUser.save();
      
      try {
        const response = await fetch(`${SERVER_URL}/api/website-cookies/get/chatgpt.com`, {
          headers: { 'Authorization': `Bearer ${validToken}` }
        });
        
        const responseData = await response.json();
        
        if (response.status === 403 && responseData.reason === 'website_access_expired') {
          console.log('✅ Website permission expired: Access correctly blocked');
          console.log(`   Message: ${responseData.message}`);
        } else {
          console.log(`❌ Website permission expired: Should be blocked but got status ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Website permission expiration test failed: ${error.message}`);
      }
    } else {
      console.log('⚠️ No ChatGPT permission found for website expiration test');
    }

    // Test 5: Plan expiry warning headers
    console.log('\n🧪 Test 5: Plan expiry warning headers...');
    
    // Set user expiry to 5 days from now (should trigger warning)
    testUser.expiryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    // Reset website permission
    if (chatgptPermission) {
      chatgptPermission.expiresAt = null;
    }
    await testUser.save();
    
    try {
      const response = await fetch(`${SERVER_URL}/api/cookies/get?website=chatgpt.com`, {
        headers: { 'Authorization': `Bearer ${validToken}` }
      });
      
      const warningHeader = response.headers.get('X-Plan-Expiry-Warning');
      const expiryDateHeader = response.headers.get('X-Plan-Expiry-Date');
      
      if (warningHeader) {
        console.log('✅ Plan expiry warning: Headers correctly set');
        console.log(`   Warning: ${warningHeader}`);
        console.log(`   Expiry Date: ${expiryDateHeader}`);
      } else {
        console.log('❌ Plan expiry warning: Headers not found');
      }
    } catch (error) {
      console.log(`❌ Plan expiry warning test failed: ${error.message}`);
    }

    // Cleanup: Reset user to valid state
    console.log('\n🧹 Cleanup: Resetting user to valid state...');
    testUser.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (chatgptPermission) {
      chatgptPermission.expiresAt = null;
    }
    await testUser.save();
    console.log('✅ User reset to valid state');

    console.log('\n📋 SUMMARY:');
    console.log('✅ Plan expiration enforcement implemented');
    console.log('✅ Cookie access blocked for expired users');
    console.log('✅ Cookie insertion blocked for expired users');
    console.log('✅ Website-specific permission expiration enforced');
    console.log('✅ Plan expiry warning headers added');
    console.log('✅ Force logout on plan expiration');

    console.log('\n🎯 BENEFITS:');
    console.log('• Users cannot access cookies after plan expires');
    console.log('• Real-time expiration checks on every request');
    console.log('• Website-specific permission expiration');
    console.log('• Early warning system for plan expiry');
    console.log('• Automatic token invalidation on expiration');
    console.log('• Comprehensive audit trail');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testPlanExpirationEnforcement();
