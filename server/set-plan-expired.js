import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function setPlanExpired() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get username from command line argument
    const username = process.argv[2];
    if (!username) {
      console.log('❌ Please provide a username as argument');
      console.log('Usage: node set-plan-expired.js <username>');
      return;
    }

    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      console.log('❌ User not found:', username);
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

    console.log('🚫 Plan set to EXPIRED');
    console.log('📅 Expiry date set to:', expiredDate);
    console.log('⏰ This was 1 hour ago, so plan is now expired');

    // Verify the change
    const updatedUser = await User.findById(user._id);
    console.log('✅ Updated user expiry date:', updatedUser.expiryDate);

  } catch (error) {
    console.error('❌ Error setting plan expired:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
setPlanExpired();

