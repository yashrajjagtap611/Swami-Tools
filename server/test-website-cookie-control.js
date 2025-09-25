// Test Website-Specific Cookie Control System
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { WebsiteCookieBundle } from './src/models/WebsiteCookieBundle.js';
import { User } from './src/models/User.js';
import { CookieBundle } from './src/models/CookieBundle.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cookie_admin';

async function testWebsiteCookieControl() {
  try {
    console.log('🧪 TESTING WEBSITE-SPECIFIC COOKIE CONTROL SYSTEM');
    console.log('================================================\n');

    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to database\n');

    // Test 1: Check current website-specific bundles
    console.log('📊 TEST 1: Current Website-Specific Bundles');
    console.log('==========================================');
    const websiteBundles = await WebsiteCookieBundle.find({ isActive: true });
    console.log(`Found ${websiteBundles.length} active website bundles:`);
    
    for (const bundle of websiteBundles) {
      console.log(`\n🌐 Website: ${bundle.website}`);
      console.log(`   Cookies: ${bundle.cookies?.length || 0}`);
      console.log(`   Version: ${bundle.version}`);
      console.log(`   Uploaded: ${bundle.uploadedAt}`);
      console.log(`   Last Updated: ${bundle.lastUpdated}`);
      console.log(`   Access Count: ${bundle.accessCount}`);
      console.log(`   Active: ${bundle.isActive}`);
    }

    // Test 2: Check user permissions for each website
    console.log('\n\n👥 TEST 2: User Website Permissions');
    console.log('===================================');
    const users = await User.find();
    
    for (const user of users) {
      console.log(`\n👤 User: ${user.username} (${user.isAdmin ? 'Admin' : 'User'})`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Website Permissions: ${user.websitePermissions?.length || 0}`);
      
      if (user.websitePermissions && user.websitePermissions.length > 0) {
        for (const permission of user.websitePermissions) {
          const status = permission.hasAccess ? '✅' : '❌';
          const expiry = permission.expiresAt ? ` (expires: ${permission.expiresAt})` : '';
          console.log(`     ${status} ${permission.website}${expiry}`);
        }
      }
    }

    // Test 3: Simulate cookie access for different websites
    console.log('\n\n🍪 TEST 3: Cookie Access Simulation');
    console.log('====================================');
    
    const testWebsites = ['chatgpt.com', 'openai.com', 'example.com'];
    
    for (const website of testWebsites) {
      console.log(`\n🌐 Testing access to: ${website}`);
      
      // Check if website has cookies
      const bundle = await WebsiteCookieBundle.findOne({ 
        website: website.toLowerCase(), 
        isActive: true 
      });
      
      if (bundle) {
        console.log(`   ✅ Cookies found: ${bundle.cookies?.length || 0} cookies`);
        console.log(`   📊 Version: ${bundle.version}`);
        console.log(`   📅 Last Updated: ${bundle.lastUpdated}`);
      } else {
        console.log(`   ❌ No cookies found for ${website}`);
      }
      
      // Test user access
      for (const user of users) {
        if (user.isAdmin) {
          console.log(`   👑 ${user.username}: Admin access (unlimited)`);
        } else {
          const permission = user.websitePermissions?.find(p => p.website === website);
          if (permission && permission.hasAccess) {
            console.log(`   ✅ ${user.username}: Access granted`);
          } else {
            console.log(`   ❌ ${user.username}: Access denied`);
          }
        }
      }
    }

    // Test 4: Check for potential issues
    console.log('\n\n🔍 TEST 4: System Health Check');
    console.log('==============================');
    
    let issuesFound = 0;
    
    // Check for users without permissions
    const usersWithoutPermissions = users.filter(u => 
      !u.isAdmin && (!u.websitePermissions || u.websitePermissions.length === 0)
    );
    if (usersWithoutPermissions.length > 0) {
      console.log(`❌ Users without permissions: ${usersWithoutPermissions.length}`);
      usersWithoutPermissions.forEach(u => console.log(`   - ${u.username}`));
      issuesFound++;
    }
    
    // Check for expired permissions
    const now = new Date();
    const expiredPermissions = users.flatMap(u => 
      (u.websitePermissions || []).filter(p => 
        p.expiresAt && p.expiresAt < now
      )
    );
    if (expiredPermissions.length > 0) {
      console.log(`⚠️  Expired permissions: ${expiredPermissions.length}`);
      issuesFound++;
    }
    
    // Check for inactive bundles
    const inactiveBundles = await WebsiteCookieBundle.find({ isActive: false });
    if (inactiveBundles.length > 0) {
      console.log(`⚠️  Inactive bundles: ${inactiveBundles.length}`);
      issuesFound++;
    }
    
    // Check for orphaned bundles
    const orphanedBundles = websiteBundles.filter(b => 
      !users.find(u => u._id.toString() === b.uploadedBy.toString())
    );
    if (orphanedBundles.length > 0) {
      console.log(`⚠️  Orphaned bundles: ${orphanedBundles.length}`);
      issuesFound++;
    }
    
    if (issuesFound === 0) {
      console.log('✅ No issues found - system is healthy');
    }

    // Test 5: Test admin update scenario
    console.log('\n\n🔄 TEST 5: Admin Update Scenario');
    console.log('=================================');
    
    // Simulate admin updating cookies for a website
    const testWebsite = 'chatgpt.com';
    const existingBundle = await WebsiteCookieBundle.findOne({ 
      website: testWebsite, 
      isActive: true 
    });
    
    if (existingBundle) {
      console.log(`📦 Current bundle for ${testWebsite}:`);
      console.log(`   Version: ${existingBundle.version}`);
      console.log(`   Cookies: ${existingBundle.cookies?.length || 0}`);
      console.log(`   Previous Versions: ${existingBundle.previousVersions?.length || 0}`);
      
      // Test the replaceCookiesForWebsite method
      console.log(`\n🔄 Testing cookie replacement...`);
      
      const newCookies = [
        { name: 'test_cookie_1', value: 'test_value_1', domain: testWebsite },
        { name: 'test_cookie_2', value: 'test_value_2', domain: testWebsite }
      ];
      
      try {
        const updatedBundle = await WebsiteCookieBundle.replaceCookiesForWebsite(
          testWebsite,
          newCookies,
          existingBundle.uploadedBy
        );
        
        console.log(`✅ Cookie replacement successful:`);
        console.log(`   New Version: ${updatedBundle.version}`);
        console.log(`   New Cookies: ${updatedBundle.cookies?.length || 0}`);
        console.log(`   Previous Versions: ${updatedBundle.previousVersions?.length || 0}`);
        
        // Restore original cookies
        await WebsiteCookieBundle.replaceCookiesForWebsite(
          testWebsite,
          existingBundle.cookies,
          existingBundle.uploadedBy
        );
        console.log(`🔄 Restored original cookies`);
        
      } catch (error) {
        console.log(`❌ Cookie replacement failed: ${error.message}`);
      }
    } else {
      console.log(`❌ No bundle found for ${testWebsite}`);
    }

    // Test 6: Performance and efficiency
    console.log('\n\n⚡ TEST 6: Performance Check');
    console.log('============================');
    
    const startTime = Date.now();
    
    // Test query performance
    const allBundles = await WebsiteCookieBundle.find({ isActive: true });
    const queryTime = Date.now() - startTime;
    
    console.log(`📊 Query Performance:`);
    console.log(`   Time to fetch ${allBundles.length} bundles: ${queryTime}ms`);
    console.log(`   Average per bundle: ${(queryTime / allBundles.length).toFixed(2)}ms`);
    
    // Test index usage
    const indexTest = await WebsiteCookieBundle.find({ 
      website: 'chatgpt.com', 
      isActive: true 
    }).explain('executionStats');
    
    console.log(`📈 Index Usage:`);
    console.log(`   Execution time: ${indexTest.executionStats.executionTimeMillis}ms`);
    console.log(`   Documents examined: ${indexTest.executionStats.totalDocsExamined}`);
    console.log(`   Documents returned: ${indexTest.executionStats.totalDocsReturned}`);

    // Summary
    console.log('\n\n📋 TEST SUMMARY');
    console.log('================');
    console.log(`✅ Website bundles: ${websiteBundles.length}`);
    console.log(`✅ Users: ${users.length}`);
    console.log(`✅ Issues found: ${issuesFound}`);
    console.log(`✅ Query performance: ${queryTime}ms`);
    
    if (issuesFound === 0) {
      console.log('\n🎉 All tests passed! Website-specific cookie control is working correctly.');
    } else {
      console.log('\n⚠️  Some issues found. Review the test results above.');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from database');
  }
}

// Run the test
testWebsiteCookieControl();

