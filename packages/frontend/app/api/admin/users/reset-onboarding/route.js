/**
 * API Route: Admin - Reset user onboarding
 * POST /api/admin/users/reset-onboarding
 *
 * Resets a user's onboarding to allow them to redo the persona builder.
 * - Clears onboarding_complete flag
 * - Clears persona_data
 * - Resets posts_analysed_count
 * - Keeps account, tier, and setup_fee_paid intact
 * - Logs the action
 * - Sends email notification
 */

import { requireAdmin } from '../../../utils/auth';
import { ensureAdminLogsTable, logAdminAction } from '../../../utils/admin-logs';
import { query } from '../../../utils/db';
import { sendOnboardingResetEmail } from '../../../lib/email';

export async function POST(request) {
  try {
    // Ensure tables exist
    await ensureAdminLogsTable();

    // Check admin access
    const adminUser = await requireAdmin(request);
    if (!adminUser) {
      return Response.json(
        { error: 'Unauthorized - admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, reason } = body;

    if (!userId) {
      return Response.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Get user to be reset
    const userResult = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return Response.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];

    // Check if user_personas table exists and has records
    try {
      // Reset persona data
      await query(
        `UPDATE user_personas
         SET onboarding_complete = false,
             persona_data = NULL,
             posts_analysed_count = 0,
             updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $1`,
        [userId]
      );
    } catch (error) {
      // Table might not exist yet if user hasn't started onboarding
      // This is fine - we just log that we cleared it
      console.log('[reset-onboarding] user_personas table not found, user may not have started onboarding');
    }

    // Log the action
    const logEntry = await logAdminAction(
      adminUser.id,
      userId,
      'persona_reset',
      reason || null,
      {
        previousStatus: 'onboarding_complete (if existed)',
        newStatus: 'onboarding_reset',
        timestamp: new Date().toISOString(),
      }
    );

    // Send email notification to user
    try {
      await sendOnboardingResetEmail({
        email: user.email,
        adminName: adminUser.email,
        reason: reason || 'Your persona has been reset by an administrator',
      });
    } catch (emailError) {
      console.error('[reset-onboarding] Failed to send email:', emailError.message);
      // Don't fail the whole operation if email fails
    }

    return Response.json({
      success: true,
      message: `Onboarding reset for user ${user.email}`,
      user: {
        id: user.id,
        email: user.email,
      },
      logEntry: {
        id: logEntry.id,
        action: logEntry.action,
        createdAt: logEntry.created_at,
      },
    });
  } catch (error) {
    console.error('[reset-onboarding] Error:', error.message);
    return Response.json(
      { error: error.message },
      { status: error.message.includes('Unauthorized') ? 403 : 500 }
    );
  }
}
