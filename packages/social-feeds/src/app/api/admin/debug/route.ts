export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { getApiAuthContext } from '@/lib/apiAuth';
import { prisma } from '@/lib/prisma';

/**
 * Debug endpoint to troubleshoot admin access issues
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await getApiAuthContext(req);

    if (!auth) {
      return NextResponse.json({
        status: 'not_authenticated',
        message: 'No authenticated user found',
      });
    }

    // Get the actual user from DB to see their role
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    return NextResponse.json({
      status: 'authenticated',
      auth,
      user,
      isAdmin: auth.role === 'admin',
      canAccessAdminPanel: auth.role === 'admin',
    });
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message,
    });
  }
}
