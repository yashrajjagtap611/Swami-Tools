import mongoose from 'mongoose';
import { User } from './src/models/User.js';
import dotenv from 'dotenv';

dotenv.config();

async function setPlanActive() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Get username from command line argument
    const username = process.argv[2];
    if (!username) {
      console.log('❌ Please provide a username as argument');
      console.log('Usage: node set-plan-active.js <username>');
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

    // Set expiry date to 30 days from now (active)
    const activeDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
    await User.findByIdAndUpdate(user._id, { 
      expiryDate: activeDate,
      isActive: true
    });

    console.log('✅ Plan set to ACTIVE');
    console.log('📅 Expiry date set to:', activeDate);
    console.log('⏰ Plan expires in 30 days');

    // Verify the change
    const updatedUser = await User.findById(user._id);
    console.log('✅ Updated user expiry date:', updatedUser.expiryDate);
    console.log('✅ Updated user active status:', updatedUser.isActive);

  } catch (error) {
    console.error('❌ Error setting plan active:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
setPlanActive();

