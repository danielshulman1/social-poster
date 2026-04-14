/**
 * Tier Database Operations
 * Handles all tier-related database queries
 */

import { query } from './db';
import { TIERS } from './tier-config';

/**
 * Ensure user_tiers table exists
 */
export async function ensureUserTiersTable() {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS user_tiers (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        current_tier VARCHAR(50) NOT NULL DEFAULT $1,
        setup_fee_paid BOOLEAN DEFAULT false,
        setup_fee_paid_at TIMESTAMP,
        subscription_start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        subscription_status VARCHAR(50) NOT NULL DEFAULT 'active',
        next_billing_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      [TIERS.FREE]
    );

    // Create index for faster lookups
    await query(
      `CREATE INDEX IF NOT EXISTS idx_user_tiers_user_id ON user_tiers(user_id)`
    );

    // Create index for subscription status queries
    await query(
      `CREATE INDEX IF NOT EXISTS idx_user_tiers_status ON user_tiers(subscription_status)`
    );

    console.log('[ensureUserTiersTable] Table created successfully');
  } catch (error) {
    console.error('[ensureUserTiersTable] Error:', error.message);
    throw error;
  }
}

/**
 * Get user's tier information
 */
export async function getUserTier(userId) {
  try {
    const result = await query(
      `SELECT * FROM user_tiers WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      // User doesn't have a tier record - return null status
      return {
        user_id: userId,
        current_tier: null,
        setup_fee_paid: false,
        subscription_status: 'none',
      };
    }

    return result.rows[0];
  } catch (error) {
    console.error('[getUserTier] Error:', error.message);
    throw error;
  }
}

/**
 * Create initial tier record for new user (with pending status for signup)
 * For use during signup transaction with a client connection
 */
export async function createUserTierPending(userId, tier, client) {
  try {
    const q = client ? client.query.bind(client) : query;
    const result = await q(
      `INSERT INTO user_tiers (user_id, current_tier, subscription_status)
       VALUES ($1, $2, 'pending_payment')
       RETURNING *`,
      [userId, tier]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[createUserTierPending] Error:', error.message);
    throw error;
  }
}

/**
 * Create initial tier record for new user
 */
export async function createUserTier(userId) {
  try {
    const result = await query(
      `INSERT INTO user_tiers (user_id, current_tier, subscription_status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, TIERS.FREE, 'active']
    );

    return result.rows[0];
  } catch (error) {
    console.error('[createUserTier] Error:', error.message);
    // Silently fail if record already exists (UNIQUE constraint)
    if (error.code === '23505') {
      return await getUserTier(userId);
    }
    throw error;
  }
}

/**
 * Update user's tier
 */
export async function updateUserTier(userId, newTier, setupFeePaid = false) {
  try {
    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const result = await query(
      `UPDATE user_tiers
       SET current_tier = $1,
           setup_fee_paid = $2,
           setup_fee_paid_at = CASE WHEN $2 = true THEN CURRENT_TIMESTAMP ELSE setup_fee_paid_at END,
           subscription_start_date = CURRENT_TIMESTAMP,
           subscription_status = 'active',
           next_billing_date = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $4
       RETURNING *`,
      [newTier, setupFeePaid, nextBillingDate, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User tier not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[updateUserTier] Error:', error.message);
    throw error;
  }
}

/**
 * Cancel user's subscription
 */
export async function cancelUserSubscription(userId) {
  try {
    const result = await query(
      `UPDATE user_tiers
       SET subscription_status = 'cancelled',
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $1
       RETURNING *`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User tier not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[cancelUserSubscription] Error:', error.message);
    throw error;
  }
}

/**
 * Reactivate cancelled subscription
 */
export async function reactivateSubscription(userId) {
  try {
    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

    const result = await query(
      `UPDATE user_tiers
       SET subscription_status = 'active',
           subscription_start_date = CURRENT_TIMESTAMP,
           next_billing_date = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING *`,
      [nextBillingDate, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User tier not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('[reactivateSubscription] Error:', error.message);
    throw error;
  }
}

/**
 * Check if user's subscription is active
 */
export async function isSubscriptionActive(userId) {
  try {
    const tierInfo = await getUserTier(userId);

    // Only 'active' status means subscription is active
    const isActive = tierInfo.subscription_status === 'active';
    const notExpired = !tierInfo.next_billing_date ||
                       new Date(tierInfo.next_billing_date) > new Date();

    return isActive && notExpired;
  } catch (error) {
    console.error('[isSubscriptionActive] Error:', error.message);
    throw error;
  }
}

/**
 * Get all users with active subscriptions (for billing)
 */
export async function getActiveSubscriptions() {
  try {
    const result = await query(
      `SELECT ut.*, u.email, u.id as user_id
       FROM user_tiers ut
       JOIN users u ON ut.user_id = u.id
       WHERE ut.subscription_status = 'active'
       AND ut.current_tier != $1
       AND (ut.next_billing_date IS NULL OR ut.next_billing_date <= CURRENT_TIMESTAMP)
       ORDER BY ut.next_billing_date ASC`,
      [TIERS.FREE]
    );

    return result.rows;
  } catch (error) {
    console.error('[getActiveSubscriptions] Error:', error.message);
    throw error;
  }
}

/**
 * Mark subscription as expired (for automated cleanup)
 */
export async function expireSubscription(userId) {
  try {
    const result = await query(
      `UPDATE user_tiers
       SET subscription_status = 'expired',
           current_tier = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $2
       RETURNING *`,
      [TIERS.FREE, userId]
    );

    return result.rows[0];
  } catch (error) {
    console.error('[expireSubscription] Error:', error.message);
    throw error;
  }
}

/**
 * Get tier analytics (for admin panel)
 */
export async function getTierAnalytics() {
  try {
    const result = await query(
      `SELECT
        current_tier,
        subscription_status,
        COUNT(*) as user_count,
        COUNT(CASE WHEN setup_fee_paid = true THEN 1 END) as setup_fee_count
       FROM user_tiers
       GROUP BY current_tier, subscription_status
       ORDER BY current_tier, subscription_status`
    );

    return result.rows;
  } catch (error) {
    console.error('[getTierAnalytics] Error:', error.message);
    throw error;
  }
}
