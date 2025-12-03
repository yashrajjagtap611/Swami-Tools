import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function PUT(request: NextRequest) {
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
    
    await connectDB();
    
    const body = await request.json();
    const { userIds, isActive } = body;

    if (!Array.isArray(userIds) || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { isActive } }
    );

    return NextResponse.json(
      { 
        message: `${result.modifiedCount} user(s) ${isActive ? 'activated' : 'deactivated'} successfully`,
        modifiedCount: result.modifiedCount
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error bulk updating users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update users' },
      { status: 500 }
    );
  }
}

