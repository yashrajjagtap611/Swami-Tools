const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

async function createAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully!');

    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    const adminName = 'Admin User';

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('\n✅ Admin user already exists!');
      console.log('Email:', adminEmail);
      console.log('Name:', existingAdmin.name);
      console.log('\n📝 You can login with these credentials:');
      console.log('   Email: ' + adminEmail);
      console.log('   Password: ' + adminPassword);
      console.log('\n⚠️  If you forgot the password, delete the user from database and run this script again.');
      await mongoose.disconnect();
      return;
    }

    // Create admin user
    const admin = new User({
      email: adminEmail,
      password: adminPassword,
      name: adminName,
    });

    await admin.save();

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Email: ' + adminEmail);
    console.log('   Password: ' + adminPassword);
    console.log('\n🔗 You can now login at: http://localhost:3000/login');
    
    await mongoose.disconnect();
    console.log('\n✅ Database connection closed.');
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin();

