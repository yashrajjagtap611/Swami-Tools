const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

async function fixIndexes() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    const db = mongoose.connection.db;
    const collection = db.collection('users');

    // List all indexes
    console.log('\nCurrent indexes:');
    const indexes = await collection.indexes();
    indexes.forEach((index, idx) => {
      console.log(`${idx + 1}. ${index.name}:`, index.key);
    });

    // Check if username index exists
    const usernameIndex = indexes.find(idx => idx.name === 'username_1' || idx.key?.username);
    
    if (usernameIndex) {
      console.log('\n⚠️  Found username index. This needs to be dropped.');
      console.log('Dropping username index...');
      
      try {
        await collection.dropIndex('username_1');
        console.log('✅ Successfully dropped username_1 index');
      } catch (dropError) {
        // Try alternative index names
        if (usernameIndex.name) {
          try {
            await collection.dropIndex(usernameIndex.name);
            console.log(`✅ Successfully dropped ${usernameIndex.name} index`);
          } catch (e) {
            console.log('⚠️  Could not drop index:', e.message);
          }
        }
      }
    } else {
      console.log('\n✅ No username index found. Database is correct.');
    }

    // Clean up users with null or empty emails
    console.log('\nCleaning up users with null emails...');
    const nullEmailUsers = await collection.countDocuments({ 
      $or: [
        { email: null },
        { email: { $exists: false } },
        { email: '' }
      ]
    });
    
    if (nullEmailUsers > 0) {
      console.log(`⚠️  Found ${nullEmailUsers} users with null/empty emails.`);
      console.log('These users will be removed to fix the database index.');
      
      const result = await collection.deleteMany({
        $or: [
          { email: null },
          { email: { $exists: false } },
          { email: '' }
        ]
      });
      console.log(`✅ Removed ${result.deletedCount} invalid user(s)`);
    } else {
      console.log('✅ No users with null emails found');
    }

    // Ensure email index exists and is unique
    console.log('\nEnsuring email index exists...');
    try {
      await collection.createIndex({ email: 1 }, { unique: true, name: 'email_1' });
      console.log('✅ Email index is properly set up');
    } catch (emailError) {
      if (emailError.code === 85) {
        console.log('✅ Email index already exists');
      } else {
        console.log('⚠️  Email index setup issue:', emailError.message);
        console.log('You may need to manually clean up duplicate/null emails in the database');
      }
    }

    // List indexes after cleanup
    console.log('\nFinal indexes:');
    const finalIndexes = await collection.indexes();
    finalIndexes.forEach((index, idx) => {
      console.log(`${idx + 1}. ${index.name}:`, index.key);
    });

    await mongoose.disconnect();
    console.log('\n✅ Database connection closed.');
    console.log('\n✅ Index cleanup complete!');
  } catch (error) {
    console.error('❌ Error fixing indexes:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

fixIndexes();

