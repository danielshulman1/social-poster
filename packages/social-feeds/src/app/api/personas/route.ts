export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { getApiAuthContext, unauthorizedText, forbiddenText } from '@/lib/apiAuth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const auth = await getApiAuthContext(req);
  if (!auth?.userId) return unauthorizedText('Unauthorized');

  try {
    const persona = await prisma.userPersona.findUnique({
      where: { userId: auth.userId },
    });

    return NextResponse.json(persona || null);
  } catch (error) {
    console.error('Error fetching persona:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await getApiAuthContext(req);
  if (!auth?.userId) return unauthorizedText('Unauthorized');

  try {
    const body = await req.json();
    const { personaData } = body;

    if (!personaData) {
      return NextResponse.json(
        { error: 'personaData is required' },
        { status: 400 }
      );
    }

    const persona = await prisma.userPersona.upsert({
      where: { userId: auth.userId },
      update: {
        personaData,
        updatedAt: new Date(),
      },
      create: {
        userId: auth.userId,
        personaData,
      },
    });

    return NextResponse.json(persona);
  } catch (error) {
    console.error('Error saving persona:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await getApiAuthContext(req);
  if (!auth?.userId) return unauthorizedText('Unauthorized');

  // Check if user is admin
  if (auth.role !== 'admin') return forbiddenText('Admin access required');

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter is required' },
        { status: 400 }
      );
    }

    // Admin can delete any user's persona
    const persona = await prisma.userPersona.findUnique({
      where: { userId },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    await prisma.userPersona.delete({
      where: { userId },
    });

    return NextResponse.json({ message: 'Persona deleted' });
  } catch (error) {
    console.error('Error deleting persona:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
