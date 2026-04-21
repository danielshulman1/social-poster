/**
 * API Route: Admin - Manage user tiers
 * GET /api/admin/users/tier?userId=123
 * POST /api/admin/users/tier - Update user tier
 */

import { requireAdmin } from '@/utils/auth';
import { ensureUserTiersTable, updateUserTier, getUserTier } from '@/utils/tier-db';
import { TIERS } from '@/utils/tier-config';

export async function GET(request) {
  try {
    // Ensure table exists
    await ensureUserTiersTable();

    // Check admin access
    const user = await requireAdmin(request);
    if (!user) {
      return Response.json(
        { error: 'Unauthorized - admin access required' },
        { status: 403 }
      );
    }

    // Get user ID from query params
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return Response.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    const tierInfo = await getUserTier(userId);

    return Response.json({
      success: true,
      tierInfo,
    });
  } catch (error) {
    console.error('[admin-tier-get] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}

export async function POST(request) {
  try {
    // Ensure table exists
    await ensureUserTiersTable();

    // Check admin access
    const user = await requireAdmin(request);
    if (!user) {
      return Response.json(
        { error: 'Unauthorized - admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, newTier, setupFeePaid } = body;

    if (!userId || !newTier) {
      return Response.json(
        { error: 'userId and newTier are required' },
        { status: 400 }
      );
    }

    if (!Object.values(TIERS).includes(newTier)) {
      return Response.json(
        { error: `Invalid tier: ${newTier}` },
        { status: 400 }
      );
    }

    // Update tier
    const updated = await updateUserTier(
      userId,
      newTier,
      setupFeePaid === true
    );

    return Response.json({
      success: true,
      message: `User tier updated to ${newTier}`,
      tierInfo: updated,
    });
  } catch (error) {
    console.error('[admin-tier-post] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}
