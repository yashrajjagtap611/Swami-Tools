import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Optional: Add a secret key check for security
    const body = await request.json();
    const { adminKey, email, password, name } = body;

    // Simple admin key check (you can make this more secure)
    const ADMIN_KEY = process.env.ADMIN_KEY || 'admin-secret-key-2024';
    
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid admin key' },
        { status: 401 }
      );
    }

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Connect to database
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return NextResponse.json(
        { 
          message: 'Admin user already exists',
          admin: {
            id: existingAdmin._id,
            email: existingAdmin.email,
            name: existingAdmin.name,
          }
        },
        { status: 200 }
      );
    }

    // Create admin user
    const admin = new User({
      email,
      password,
      name: name || 'Admin User',
    });

    await admin.save();

    return NextResponse.json(
      {
        message: 'Admin user created successfully',
        admin: {
          id: admin._id,
          email: admin.email,
          name: admin.name,
        },
        credentials: {
          email,
          password: '***hidden***',
        }
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Admin creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

