import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function testPlanExpiry() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find a user to test with
    const user = await User.findOne({ username: 'admin' });
    if (!user) {
      console.log('❌ No admin user found. Please create a user first.');
      return;
    }

    console.log('👤 Found user:', user.username);
    console.log('📅 Current expiry date:', user.expiryDate);
    console.log('✅ Account active:', user.isActive);

    // Set expiry date to 1 hour ago (expired)
    const expiredDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    await User.findByIdAndUpdate(user._id, { 
      expiryDate: expiredDate 
    });

    console.log('🚫 Set user plan to expired (1 hour ago)');
    console.log('📅 New expiry date:', expiredDate);

    // Test the plan check logic
    const now = new Date();
    const expiryDate = new Date(expiredDate);
    const planExpiresIn = Math.floor((expiryDate - now) / 1000);
    
    console.log('⏰ Current time:', now);
    console.log('⏰ Expiry time:', expiryDate);
    console.log('⏰ Seconds until expiry:', planExpiresIn);
    
    if (planExpiresIn < 0) {
      console.log('🚫 Plan is EXPIRED');
    } else {
      console.log('✅ Plan is still active');
    }

    // Test with a future expiry date
    const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    await User.findByIdAndUpdate(user._id, { 
      expiryDate: futureDate 
    });

    console.log('✅ Set user plan to expire in 24 hours');
    console.log('📅 New expiry date:', futureDate);

    const futureExpiresIn = Math.floor((futureDate - now) / 1000);
    console.log('⏰ Seconds until expiry:', futureExpiresIn);

    if (futureExpiresIn < 0) {
      console.log('🚫 Plan is EXPIRED');
    } else {
      console.log('✅ Plan is still active');
    }

  } catch (error) {
    console.error('❌ Error testing plan expiry:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the test
testPlanExpiry();

