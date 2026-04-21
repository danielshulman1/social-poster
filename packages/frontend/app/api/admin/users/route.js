import { NextResponse } from 'next/server';
import { query, getClient } from '@/utils/db';
import { requireAdmin, hashPassword } from '@/utils/auth';
import { TIERS } from '@/utils/tier-config';
import { ensureUserTiersTable } from '@/utils/tier-db';

export async function GET(request) {
    try {
        const user = await requireAdmin(request);

        // Get organization info
        const orgInfo = await query(
            `SELECT id, name, max_users FROM organisations WHERE id = $1`,
            [user.org_id]
        );

        // Get all users in the organization with stats
        const result = await query(
            `SELECT 
        u.id, u.email, u.first_name, u.last_name, u.created_at,
        om.role, om.is_admin, om.is_active,
        COUNT(DISTINCT d.id) FILTER (WHERE d.created_at > NOW() - INTERVAL '7 days') as drafts_7d,
        COUNT(DISTINCT t.id) as tasks_count,
        COUNT(DISTINCT a.id) FILTER (WHERE a.created_at > NOW() - INTERVAL '7 days') as actions_7d
       FROM users u
       JOIN org_members om ON u.id = om.user_id
       LEFT JOIN email_drafts d ON u.id = d.user_id
       LEFT JOIN detected_tasks t ON u.id = t.user_id AND t.status != 'completed'
       LEFT JOIN user_activity a ON u.id = a.user_id
       WHERE om.org_id = $1
       GROUP BY u.id, om.role, om.is_admin, om.is_active
       ORDER BY u.created_at DESC`,
            [user.org_id]
        );

        return NextResponse.json({
            users: result.rows,
            organization: orgInfo.rows[0],
            currentUserCount: result.rows.length,
        });
    } catch (error) {
        if (error.message === 'Admin access required') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }
        console.error('Get users error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    const client = await getClient();

    try {
        const admin = await requireAdmin(request);
        const { email, password, firstName, lastName, role, isAdmin, tier, selectedTier } = await request.json();
        const normalizedEmail = email?.trim().toLowerCase();
        const allowedRoles = new Set(['member', 'manager', 'admin']);
        const requestedRole = allowedRoles.has(role) ? role : 'member';
        const requestedIsAdmin = Boolean(isAdmin) || requestedRole === 'admin';
        const requestedTier = selectedTier || tier || TIERS.FREE;
        const allowedTiers = new Set(Object.values(TIERS));

        if (!normalizedEmail || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            );
        }

        if (!allowedTiers.has(requestedTier)) {
            return NextResponse.json(
                { error: 'A valid package is required' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            );
        }

        await ensureUserTiersTable();
        await client.query('BEGIN');

        // Check organization user limit
        const orgCheck = await client.query(
            `SELECT o.max_users, COUNT(om.id) as current_users
             FROM organisations o
             LEFT JOIN org_members om ON o.id = om.org_id AND om.is_active = true
             WHERE o.id = $1
             GROUP BY o.id, o.max_users`,
            [admin.org_id]
        );

        if (orgCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { error: 'Organization not found' },
                { status: 404 }
            );
        }

        const { max_users, current_users } = orgCheck.rows[0];
        if (parseInt(current_users) >= parseInt(max_users)) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                { error: `User limit reached. Your organization is limited to ${max_users} users. Please upgrade your subscription.` },
                { status: 403 }
            );
        }

        // Check if user already exists
        const existingUser = await client.query(
            'SELECT id FROM users WHERE email = $1',
            [normalizedEmail]
        );

        let user;
        let userId;
        const passwordHash = await hashPassword(password);

        if (existingUser.rows.length > 0) {
            userId = existingUser.rows[0].id;

            const membershipCheck = await client.query(
                `SELECT id, is_active FROM org_members WHERE org_id = $1 AND user_id = $2`,
                [admin.org_id, userId]
            );

            if (membershipCheck.rows[0]?.is_active) {
                await client.query('ROLLBACK');
                return NextResponse.json(
                    { error: 'User is already part of this organization' },
                    { status: 400 }
                );
            }

            const userInfo = await client.query(
                `SELECT id, email, first_name, last_name FROM users WHERE id = $1`,
                [userId]
            );
            user = userInfo.rows[0];
        } else {
            const userResult = await client.query(
                `INSERT INTO users (email, first_name, last_name)
                 VALUES ($1, $2, $3)
                 RETURNING id, email, first_name, last_name, created_at`,
                [normalizedEmail, firstName?.trim() || null, lastName?.trim() || null]
            );

            user = userResult.rows[0];
            userId = user.id;
        }

        const authAccountUpdate = await client.query(
            `UPDATE auth_accounts
             SET password_hash = $1, updated_at = NOW()
             WHERE user_id = $2 AND provider = 'email'`,
            [passwordHash, userId]
        );

        if (authAccountUpdate.rowCount === 0) {
            await client.query(
                `INSERT INTO auth_accounts (user_id, provider, password_hash)
                 VALUES ($1, 'email', $2)`,
                [userId, passwordHash]
            );
        }

        const nextBillingDate = new Date();
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);

        await client.query(
            `INSERT INTO user_tiers (
                user_id,
                current_tier,
                setup_fee_paid,
                setup_fee_paid_at,
                subscription_start_date,
                subscription_status,
                next_billing_date,
                updated_at
             )
             VALUES ($1, $2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'active', $3, CURRENT_TIMESTAMP)
             ON CONFLICT (user_id)
             DO UPDATE SET
                current_tier = EXCLUDED.current_tier,
                setup_fee_paid = true,
                setup_fee_paid_at = CURRENT_TIMESTAMP,
                subscription_start_date = CURRENT_TIMESTAMP,
                subscription_status = 'active',
                next_billing_date = EXCLUDED.next_billing_date,
                updated_at = CURRENT_TIMESTAMP`,
            [userId, requestedTier, nextBillingDate]
        );

        const existingMembership = await client.query(
            `SELECT id FROM org_members WHERE org_id = $1 AND user_id = $2`,
            [admin.org_id, userId]
        );

        if (existingMembership.rows.length > 0) {
            await client.query(
                `UPDATE org_members
                 SET role = $1, is_admin = $2, is_active = true
                 WHERE org_id = $3 AND user_id = $4`,
                [requestedRole, requestedIsAdmin, admin.org_id, userId]
            );
        } else {
            await client.query(
                `INSERT INTO org_members (org_id, user_id, role, is_admin, is_active)
                 VALUES ($1, $2, $3, $4, true)`,
                [admin.org_id, userId, requestedRole, requestedIsAdmin]
            );
        }

        await client.query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'user_created', $3)`,
            [admin.org_id, admin.id, `Admin added user ${normalizedEmail} to organization`]
        );

        await client.query('COMMIT');

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: requestedRole,
                isAdmin: requestedIsAdmin,
                tier: requestedTier,
            },
        });
    } catch (error) {
        await client.query('ROLLBACK').catch(() => { });
        if (error.message === 'Admin access required') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }
        if (error.message === 'Unauthorized') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        console.error('Create user error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to create user' },
            { status: 500 }
        );
    } finally {
        client.release();
    }
}

export async function PUT(request) {
    try {
        const admin = await requireAdmin(request);
        const { userId, isActive, newPassword } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Handle password reset
        if (newPassword !== undefined) {
            if (newPassword.length < 8) {
                return NextResponse.json(
                    { error: 'Password must be at least 8 characters' },
                    { status: 400 }
                );
            }

            const passwordHash = await hashPassword(newPassword);

            // Update password
            await query(
                `UPDATE auth_accounts 
                 SET password_hash = $1
                 WHERE user_id = $2 AND provider = 'email'`,
                [passwordHash, userId]
            );

            // Log activity
            await query(
                `INSERT INTO user_activity (org_id, user_id, activity_type, description)
                 VALUES ($1, $2, 'password_reset', $3)`,
                [admin.org_id, admin.id, `Admin reset password for user`]
            );

            return NextResponse.json({ success: true, message: 'Password reset successfully' });
        }

        // Handle status update
        if (isActive !== undefined) {
            await query(
                `UPDATE org_members 
                 SET is_active = $1
                 WHERE org_id = $2 AND user_id = $3`,
                [isActive, admin.org_id, userId]
            );

            // Log activity
            await query(
                `INSERT INTO user_activity (org_id, user_id, activity_type, description)
                 VALUES ($1, $2, 'user_status_changed', $3)`,
                [admin.org_id, admin.id, `User ${isActive ? 'activated' : 'deactivated'}`]
            );

            return NextResponse.json({ success: true });
        }

        return NextResponse.json(
            { error: 'No valid update parameters provided' },
            { status: 400 }
        );
    } catch (error) {
        if (error.message === 'Admin access required') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }
        console.error('Update user error:', error);
        return NextResponse.json(
            { error: 'Failed to update user' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const admin = await requireAdmin(request);
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Verify user belongs to admin's organization
        const userCheck = await query(
            `SELECT u.email FROM users u
             JOIN org_members om ON u.id = om.user_id
             WHERE u.id = $1 AND om.org_id = $2`,
            [userId, admin.org_id]
        );

        if (userCheck.rows.length === 0) {
            return NextResponse.json(
                { error: 'User not found in your organization' },
                { status: 404 }
            );
        }

        const userEmail = userCheck.rows[0].email;

        // Remove user from organization (cascade will handle related records)
        await query(
            `DELETE FROM org_members WHERE org_id = $1 AND user_id = $2`,
            [admin.org_id, userId]
        );

        // Log activity
        await query(
            `INSERT INTO user_activity (org_id, user_id, activity_type, description)
             VALUES ($1, $2, 'user_deleted', $3)`,
            [admin.org_id, admin.id, `Admin removed user: ${userEmail}`]
        );

        return NextResponse.json({ success: true, message: 'User removed from organization' });
    } catch (error) {
        if (error.message === 'Admin access required') {
            return NextResponse.json(
                { error: 'Admin access required' },
                { status: 403 }
            );
        }
        console.error('Delete user error:', error);
        return NextResponse.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}
