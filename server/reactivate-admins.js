import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/cookie_admin';

async function main() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');
    const res = await User.updateMany(
      { isAdmin: true, isActive: { $ne: true } },
      { $set: { isActive: true } }
    );
    console.log('Reactivated admins:', res.modifiedCount ?? res.nModified);
    const admins = await User.find({ isAdmin: true }, { username: 1, isActive: 1 });
    console.log('Admins:', admins.map(a => ({ username: a.username, isActive: a.isActive })));
  } catch (e) {
    console.error('Error:', e);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

main();



