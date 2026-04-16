/**
 * API Route: Admin - Tier analytics
 * GET /api/admin/tiers/analytics
 */

import { requireAdmin } from '@/utils/auth';
import { ensureUserTiersTable, getTierAnalytics } from '@/utils/tier-db';

export const dynamic = 'force-dynamic';

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

    const analytics = await getTierAnalytics();

    return Response.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('[admin-tier-analytics] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}
