/**
 * Tier-based Middleware and HOCs
 * For protecting pages and API routes based on tier
 */

import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { getUserTier, isSubscriptionActive } from '../utils/tier-db';
import { TIERS } from '../utils/tier-config';

/**
 * Middleware for API routes
 * Usage in /app/api/route.js:
 *   export async function GET(request) {
 *     const user = await requireTier(request, TIERS.STARTER);
 *     // proceed with request
 *   }
 */
export async function requireTier(request, requiredTier = TIERS.FREE) {
  try {
    // Get token from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return {
        error: true,
        status: 401,
        message: 'Unauthorized - no token',
      };
    }

    const token = authHeader.substring(7);
    let userId;

    try {
      const decoded = jwtDecode(token);
      userId = decoded.userId || decoded.sub;

      if (!userId) {
        return {
          error: true,
          status: 401,
          message: 'Unauthorized - invalid token',
        };
      }
    } catch (err) {
      return {
        error: true,
        status: 401,
        message: 'Unauthorized - invalid token format',
      };
    }

    // Check tier
    const tierInfo = await getUserTier(userId);
    const isActive = await isSubscriptionActive(userId);

    const tierOrder = {
      [TIERS.FREE]: 0,
      [TIERS.STARTER]: 1,
      [TIERS.CORE]: 2,
      [TIERS.PREMIUM]: 3,
    };

    const userLevel = tierOrder[tierInfo.current_tier] || 0;
    const requiredLevel = tierOrder[requiredTier] || 0;

    if (!isActive || userLevel < requiredLevel) {
      return {
        error: true,
        status: 403,
        message: `This feature requires ${requiredTier} tier or higher`,
        requiredTier,
        currentTier: tierInfo.current_tier,
      };
    }

    return {
      error: false,
      userId,
      tier: tierInfo.current_tier,
      tierInfo,
    };
  } catch (error) {
    console.error('[requireTier] Error:', error.message);
    return {
      error: true,
      status: 500,
      message: 'Internal server error',
    };
  }
}

/**
 * Client-side hook for checking tier access
 * Usage: const { hasAccess, tier } = useTierCheck();
 */
export function useTierCheck() {
  const [tierInfo, setTierInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkTier() {
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/auth/tier-check', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) {
          setTierInfo(null);
        } else {
          const data = await response.json();
          setTierInfo(data);
        }
      } catch (error) {
        console.error('Failed to check tier:', error);
        setTierInfo(null);
      } finally {
        setLoading(false);
      }
    }

    checkTier();
  }, []);

  const hasTierAccess = (requiredTier) => {
    if (!tierInfo) return false;

    const tierOrder = {
      [TIERS.FREE]: 0,
      [TIERS.STARTER]: 1,
      [TIERS.CORE]: 2,
      [TIERS.PREMIUM]: 3,
    };

    return (
      tierInfo.isActive &&
      (tierOrder[tierInfo.current_tier] || 0) >=
        (tierOrder[requiredTier] || 0)
    );
  };

  return {
    tier: tierInfo?.current_tier,
    tierInfo,
    loading,
    hasTierAccess,
    isActive: tierInfo?.isActive,
  };
}

/**
 * Client-side component wrapper for tier-protected content
 * Usage:
 *   <TierGate requiredTier={TIERS.PREMIUM}>
 *     <PremiumFeature />
 *   </TierGate>
 */
export function TierGate({ requiredTier, children, fallback }) {
  const { hasTierAccess, loading } = useTierCheck();

  if (loading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  if (!hasTierAccess(requiredTier)) {
    return fallback || <UpgradePrompt requiredTier={requiredTier} />;
  }

  return children;
}

/**
 * Generic upgrade prompt component
 */
function UpgradePrompt({ requiredTier }) {
  return (
    <div className="rounded-lg border-2 border-yellow-200 bg-yellow-50 p-6">
      <h3 className="text-lg font-semibold text-yellow-900">
        Upgrade Required
      </h3>
      <p className="mt-2 text-yellow-800">
        This feature requires a {requiredTier} tier subscription or higher.
      </p>
      <a
        href="/dashboard/upgrade"
        className="mt-4 inline-block rounded bg-yellow-600 px-4 py-2 text-white hover:bg-yellow-700"
      >
        View Plans & Upgrade
      </a>
    </div>
  );
}
