import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/models/User.js';

dotenv.config();
const MONGODB_URI = process.env.MONGODB_URI;

// Admin credentials
const adminUser = {
    username: "Yash95",
    email: "yash95@swami-tools.local",
    password: "123456", // Make sure to use this exact password
    isAdmin: true
};

async function createAdmin() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ username: adminUser.username });
        if (existingAdmin) {
            console.log('Admin user already exists');
            process.exit(0);
        }

        // Create new admin user
        const passwordHash = await bcrypt.hash(adminUser.password, 10);
        const user = await User.create({
            username: adminUser.username,
            email: adminUser.email.toLowerCase(),
            passwordHash,
            isAdmin: adminUser.isAdmin
        });

        console.log('Admin user created successfully:');
        console.log('Username:', adminUser.username);
        console.log('Password:', adminUser.password);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

createAdmin();
