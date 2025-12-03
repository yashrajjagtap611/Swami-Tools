import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
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
    
    // Get all unique websites from all users' permissions
    const users = await User.find({});
    const websiteSet = new Set<string>();
    
    users.forEach((user: any) => {
      if (user.websitePermissions && Array.isArray(user.websitePermissions)) {
        user.websitePermissions.forEach((perm: any) => {
          if (perm.website) {
            websiteSet.add(perm.website);
          }
        });
      }
    });
    
    const websites = Array.from(websiteSet).sort();
    
    return NextResponse.json(
      { data: websites.map(website => ({ website })) },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching websites:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch websites' },
      { status: 500 }
    );
  }
}

