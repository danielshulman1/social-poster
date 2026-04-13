import { NextResponse } from 'next/server';
import { requireAuth } from '@/utils/auth';
import { createUserTier } from '@/utils/tier-db';

export async function GET(request) {
    try {
        const user = await requireAuth(request);

        // Auto-create tier record if user doesn't have one
        try {
            await createUserTier(user.id);
        } catch (tierError) {
            // Silently continue if tier creation fails (user may already have one)
            console.debug('[auth/me] Tier creation result:', tierError.message);
        }

        return NextResponse.json({
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role,
                isAdmin: user.is_admin,
                orgId: user.org_id,
                isSuperadmin: user.is_superadmin,
            },
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: 401 }
        );
    }
}
