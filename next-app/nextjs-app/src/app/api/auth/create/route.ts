import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    verifyToken(token);
    
    const body = await request.json();
    const { username, email, password } = body;
    
    // Support both 'username' and 'email' fields for backward compatibility
    const userEmail = email || username;

    if (!userEmail || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: userEmail });
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create new user
    const user = new User({
      email: userEmail,
      password,
      name: userEmail.includes('@') ? userEmail.split('@')[0] : userEmail,
    });

    await user.save();

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating user:', error);
    
    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      if (error.keyPattern?.email) {
        return NextResponse.json(
          { error: 'User with this email already exists' },
          { status: 400 }
        );
      } else if (error.keyPattern?.username) {
        return NextResponse.json(
          { error: 'Database index conflict. Please contact administrator to fix database indexes.' },
          { status: 500 }
        );
      }
    }
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message).join(', ');
      return NextResponse.json(
        { error: messages || 'Validation error' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

