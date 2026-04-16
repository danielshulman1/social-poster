/**
 * API Route: Check current user tier
 * GET /api/auth/tier-check
 */

import { requireAuth } from '@/utils/auth';
import { getUserTierInfo } from '@/utils/tier-check';
import { ensureUserTiersTable } from '@/utils/tier-db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    // Ensure table exists
    await ensureUserTiersTable();

    // Check authentication
    const user = await requireAuth(request);
    if (!user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get tier info
    const tierInfo = await getUserTierInfo(user.id);

    return Response.json({
      userId: user.id,
      email: user.email,
      ...tierInfo,
    });
  } catch (error) {
    console.error('[tier-check] Error:', error.message);
    return Response.json(
      { error: 'Failed to check tier' },
      { status: 500 }
    );
  }
}
