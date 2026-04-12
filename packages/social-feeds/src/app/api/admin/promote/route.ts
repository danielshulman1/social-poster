export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { getApiAuthContext, unauthorizedText } from '@/lib/apiAuth';
import { prisma } from '@/lib/prisma';

/**
 * Promotes a user to admin by email.
 * This is an internal endpoint - requires the workflow secret for security.
 */
export async function POST(req: NextRequest) {
  const auth = await getApiAuthContext(req);

  // Must be called with workflow secret (internal use only)
  if (!auth?.userId || auth.source !== 'workflow') {
    return unauthorizedText('Workflow authentication required');
  }

  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { email },
      data: { role: 'admin' },
      select: { id: true, email: true, role: true },
    });

    return NextResponse.json({
      message: 'User promoted to admin',
      user,
    });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.error('Error promoting user:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
