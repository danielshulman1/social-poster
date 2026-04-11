/**
 * Admin Panel Component - Tier Management
 * Shows all users and their tiers, allows manual upgrades/downgrades
 */

import React, { useState, useEffect } from 'react';
import { TIERS, TIER_CONFIG } from '../utils/tier-config';

export function AdminTierManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newTier, setNewTier] = useState('');
  const [setupFeePaid, setSetupFeePaid] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      setMessage(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function loadUserTier(userId) {
    try {
      const response = await fetch(
        `/api/admin/users/tier?userId=${userId}`,
        {
          headers: {
            'Authorization': `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load tier info');
      }

      const data = await response.json();
      return data.tierInfo;
    } catch (error) {
      console.error('Error loading tier:', error);
      return null;
    }
  }

  async function handleSelectUser(user) {
    const tierInfo = await loadUserTier(user.id);
    setSelectedUser({ ...user, tierInfo });
    setNewTier(tierInfo?.current_tier || TIERS.FREE);
    setSetupFeePaid(tierInfo?.setup_fee_paid || false);
    setMessage('');
  }

  async function handleUpdateTier() {
    if (!selectedUser) return;

    try {
      setUpdating(true);
      setMessage('');

      const response = await fetch('/api/admin/users/tier', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          newTier,
          setupFeePaid,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      setMessage(`✅ ${data.message}`);
      setSelectedUser({
        ...selectedUser,
        tierInfo: data.tierInfo,
      });

      // Refresh users list
      loadUsers();
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  }

  async function handleCancelSubscription() {
    if (!selectedUser) return;

    if (
      !confirm(
        'Cancel subscription? User will revert to FREE tier.'
      )
    ) {
      return;
    }

    try {
      setUpdating(true);
      setMessage('');

      const response = await fetch('/api/admin/users/tier/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      setMessage(`✅ ${data.message}`);
      setSelectedUser({
        ...selectedUser,
        tierInfo: data.tierInfo,
      });

      loadUsers();
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  }

  async function handleResetOnboarding() {
    if (!selectedUser) return;

    const reason = prompt(
      'Optional: Enter a reason for resetting onboarding (leave blank for none):'
    );

    if (reason === null) {
      // User cancelled
      return;
    }

    try {
      setUpdating(true);
      setMessage('');

      const response = await fetch('/api/admin/users/reset-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          reason: reason || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error);
      }

      const data = await response.json();
      setMessage(
        `✅ ${data.message} - Email notification sent to user`
      );

      loadUsers();
    } catch (error) {
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  }

  if (loading) {
    return <div className="p-4">Loading users...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Tier Management</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Users List */}
        <div className="rounded-lg border border-gray-200">
          <h2 className="border-b border-gray-200 p-4 font-semibold">
            Users
          </h2>
          <div className="max-h-96 overflow-y-auto">
            {users.length === 0 ? (
              <div className="p-4 text-gray-500">No users found</div>
            ) : (
              users.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user)}
                  className={`w-full border-b border-gray-100 p-4 text-left transition ${
                    selectedUser?.id === user.id
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-semibold">{user.email}</div>
                  <div className="text-sm text-gray-500">
                    ID: {user.id}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Tier Editor */}
        {selectedUser ? (
          <div className="rounded-lg border border-gray-200">
            <h2 className="border-b border-gray-200 p-4 font-semibold">
              Edit Tier
            </h2>
            <div className="space-y-4 p-4">
              <div>
                <label className="block text-sm font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={selectedUser.email}
                  disabled
                  className="mt-1 w-full rounded border border-gray-300 bg-gray-100 p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium">
                  Current Tier
                </label>
                <div className="mt-1 rounded border border-gray-300 bg-gray-50 p-2">
                  {selectedUser.tierInfo?.current_tier || 'free'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium">
                  New Tier
                </label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value)}
                  className="mt-1 w-full rounded border border-gray-300 p-2"
                >
                  {Object.values(TIERS).map((tier) => (
                    <option key={tier} value={tier}>
                      {TIER_CONFIG[tier]?.name || tier}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="setupFee"
                  checked={setupFeePaid}
                  onChange={(e) => setSetupFeePaid(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label
                  htmlFor="setupFee"
                  className="text-sm font-medium"
                >
                  Mark Setup Fee as Paid
                </label>
              </div>

              {selectedUser.tierInfo?.subscription_status && (
                <div>
                  <label className="block text-sm font-medium">
                    Status
                  </label>
                  <div className="mt-1 flex items-center gap-2 rounded border border-gray-300 bg-gray-50 p-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        selectedUser.tierInfo.subscription_status ===
                        'active'
                          ? 'bg-green-500'
                          : 'bg-red-500'
                      }`}
                    />
                    {selectedUser.tierInfo.subscription_status}
                  </div>
                </div>
              )}

              {selectedUser.tierInfo?.next_billing_date && (
                <div>
                  <label className="block text-sm font-medium">
                    Next Billing Date
                  </label>
                  <div className="mt-1 rounded border border-gray-300 bg-gray-50 p-2 text-sm">
                    {new Date(
                      selectedUser.tierInfo.next_billing_date
                    ).toLocaleDateString()}
                  </div>
                </div>
              )}

              {message && (
                <div
                  className={`rounded p-2 text-sm ${
                    message.startsWith('✅')
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700'
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleUpdateTier}
                  disabled={updating}
                  className="flex-1 rounded bg-blue-600 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : 'Update Tier'}
                </button>

                {selectedUser.tierInfo?.current_tier !== TIERS.FREE && (
                  <button
                    onClick={handleCancelSubscription}
                    disabled={updating}
                    className="flex-1 rounded bg-red-600 py-2 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    Cancel Sub.
                  </button>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-semibold mb-2">Additional Actions</h4>
                <button
                  onClick={handleResetOnboarding}
                  disabled={updating}
                  className="w-full rounded bg-purple-600 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {updating ? 'Resetting...' : 'Reset Onboarding'}
                </button>
                <p className="text-xs text-gray-500 mt-2">
                  Clear persona data and allow user to redo onboarding
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
            <div className="text-center text-gray-500">
              Select a user to manage their tier
            </div>
          </div>
        )}
      </div>

      {/* Quick Reference */}
      <div className="rounded-lg border border-gray-200">
        <h2 className="border-b border-gray-200 p-4 font-semibold">
          Tier Reference
        </h2>
        <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-4">
          {Object.entries(TIER_CONFIG).map(([tier, config]) => (
            <div
              key={tier}
              className="rounded border border-gray-200 p-3"
            >
              <div className="font-semibold">{config.name}</div>
              <div className="text-sm text-gray-600">
                £{(config.monthlyPrice / 100).toFixed(2)}/month
              </div>
              <ul className="mt-2 space-y-1 text-xs text-gray-600">
                <li>
                  📱 {config.features.maxPlatforms ||
                    'Unlimited'}{' '}
                  platforms
                </li>
                <li>
                  📝 {config.features.postsPerWeek ||
                    'Unlimited'}{' '}
                  posts/week
                </li>
                {config.features.voiceTraining && (
                  <li>🎤 Voice training</li>
                )}
                {config.features.checkInCalls && (
                  <li>📞 Check-in calls</li>
                )}
                {config.features.prioritySupport && (
                  <li>⭐ Priority support</li>
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function getAuthToken() {
  // Get from localStorage or sessionStorage
  return localStorage.getItem('auth_token');
}
