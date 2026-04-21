/**
 * API Route: Admin - Cancel user subscription
 * POST /api/admin/users/tier/cancel
 */

import { requireAdmin } from '@/utils/auth';
import {
  ensureUserTiersTable,
  cancelUserSubscription,
} from '@/utils/tier-db';

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
    const { userId } = body;

    if (!userId) {
      return Response.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Cancel subscription
    const updated = await cancelUserSubscription(userId);

    return Response.json({
      success: true,
      message: 'Subscription cancelled',
      tierInfo: updated,
    });
  } catch (error) {
    console.error('[admin-tier-cancel] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}
