/**
 * Admin Logs Database Operations
 * Track all admin actions for audit trail
 */

import { query } from './db';

/**
 * Ensure admin_logs table exists
 */
export async function ensureAdminLogsTable() {
  try {
    await query(
      `CREATE TABLE IF NOT EXISTS admin_logs (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        reason TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    );

    // Create index for faster lookups
    await query(
      `CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON admin_logs(user_id)`
    );

    await query(
      `CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON admin_logs(admin_id)`
    );

    await query(
      `CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action)`
    );

    console.log('[ensureAdminLogsTable] Table created successfully');
  } catch (error) {
    console.error('[ensureAdminLogsTable] Error:', error.message);
    throw error;
  }
}

/**
 * Log an admin action
 */
export async function logAdminAction(adminId, userId, action, reason = null, metadata = null) {
  try {
    await ensureAdminLogsTable();

    const result = await query(
      `INSERT INTO admin_logs (admin_id, user_id, action, reason, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [adminId, userId, action, reason, metadata ? JSON.stringify(metadata) : null]
    );

    console.log(`[logAdminAction] ${action} for user ${userId} by admin ${adminId}`);
    return result.rows[0];
  } catch (error) {
    console.error('[logAdminAction] Error:', error.message);
    throw error;
  }
}

/**
 * Get admin logs for a user
 */
export async function getAdminLogsForUser(userId) {
  try {
    await ensureAdminLogsTable();

    const result = await query(
      `SELECT
        al.*,
        u.email as admin_email
       FROM admin_logs al
       LEFT JOIN users u ON al.admin_id = u.id
       WHERE al.user_id = $1
       ORDER BY al.created_at DESC
       LIMIT 100`,
      [userId]
    );

    return result.rows;
  } catch (error) {
    console.error('[getAdminLogsForUser] Error:', error.message);
    throw error;
  }
}

/**
 * Get all admin logs with filters
 */
export async function getAdminLogs(filters = {}) {
  try {
    await ensureAdminLogsTable();

    let query_text = `
      SELECT
        al.*,
        u.email as admin_email,
        u2.email as user_email
       FROM admin_logs al
       LEFT JOIN users u ON al.admin_id = u.id
       LEFT JOIN users u2 ON al.user_id = u2.id
       WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (filters.action) {
      query_text += ` AND al.action = $${paramIndex}`;
      params.push(filters.action);
      paramIndex++;
    }

    if (filters.adminId) {
      query_text += ` AND al.admin_id = $${paramIndex}`;
      params.push(filters.adminId);
      paramIndex++;
    }

    if (filters.userId) {
      query_text += ` AND al.user_id = $${paramIndex}`;
      params.push(filters.userId);
      paramIndex++;
    }

    if (filters.startDate) {
      query_text += ` AND al.created_at >= $${paramIndex}`;
      params.push(filters.startDate);
      paramIndex++;
    }

    query_text += ` ORDER BY al.created_at DESC LIMIT 1000`;

    const result = await query(query_text, params);
    return result.rows;
  } catch (error) {
    console.error('[getAdminLogs] Error:', error.message);
    throw error;
  }
}
