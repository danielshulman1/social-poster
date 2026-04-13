export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { getApiAuthContext, unauthorizedText, forbiddenText } from '@/lib/apiAuth';
import { prisma } from '@/lib/prisma';

/**
 * Admin endpoint to authorize a user to re-run their persona audit
 * Allows one more audit run without removing the lock
 */
export async function POST(req: NextRequest) {
  const auth = await getApiAuthContext(req);
  if (!auth?.userId) return unauthorizedText('Unauthorized');

  // Must be admin
  if (auth.role !== 'admin') return forbiddenText('Admin access required');

  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Check if user has a persona
    const persona = await prisma.userPersona.findUnique({
      where: { userId },
    });

    if (!persona) {
      return NextResponse.json(
        { error: 'User has no persona' },
        { status: 404 }
      );
    }

    // Check if audit has been used
    if (!persona.auditUsed) {
      return NextResponse.json(
        { error: 'User has not used their audit yet' },
        { status: 400 }
      );
    }

    // Authorize for one more run
    const updated = await prisma.userPersona.update({
      where: { userId },
      data: {
        auditAuthorizedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: 'User authorized for one more persona audit',
      persona: {
        userId: updated.userId,
        auditUsed: updated.auditUsed,
        authorizedAt: updated.auditAuthorizedAt,
      },
    });
  } catch (error: any) {
    console.error('Error authorizing persona audit:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
