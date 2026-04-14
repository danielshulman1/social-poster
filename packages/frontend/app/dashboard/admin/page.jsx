'use client';

import { useState, useEffect } from 'react';
import { Shield, Users, Mail, CheckCircle2, TrendingUp, Plus, X, MoreVertical, Trash2, Key, ListTodo, CreditCard } from 'lucide-react';
import { TIERS, getTierConfig } from '../utils/tier-config';

export default function AdminPage() {
    const [hasAccess, setHasAccess] = useState(null);
    const [users, setUsers] = useState([]);
    const [activities, setActivities] = useState([]);
    const [orgTasks, setOrgTasks] = useState([]);
    const [organization, setOrganization] = useState(null);
    const [stats, setStats] = useState({
        activeUsers: 0,
        drafts7d: 0,
        openTasks: 0,
        emails7d: 0,
    });
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
    const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'member',
        isAdmin: false,
    });
    const [newTask, setNewTask] = useState({
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        assignedTo: '',
    });
    const [resetPassword, setResetPassword] = useState({
        userId: '',
        newPassword: '',
    });
    const [openDropdownId, setOpenDropdownId] = useState(null);
    const [showTierModal, setShowTierModal] = useState(false);
    const [selectedUserForTier, setSelectedUserForTier] = useState(null);
    const [selectedTier, setSelectedTier] = useState('free');
    const [tierUserLoading, setTierUserLoading] = useState(false);
    const [tierMessage, setTierMessage] = useState('');

    useEffect(() => {
        checkAccess();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdownId) {
                const dropdown = event.target.closest('[data-dropdown]');
                if (!dropdown) {
                    setOpenDropdownId(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdownId]);

    const checkAccess = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            console.log('[AdminPage] Fetching users with token:', token ? 'present' : 'missing');
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` },
            });

            console.log('[AdminPage] API response status:', res.status);
            if (res.ok) {
                setHasAccess(true);
                const data = await res.json();
                console.log('[AdminPage] Users received:', data.users?.length || 0);
                setUsers(data.users);
                setOrganization(data.organization);
                calculateStats(data.users);
                fetchActivity();
                fetchOrgTasks();
            } else {
                console.log('[AdminPage] Access denied');
                setHasAccess(false);
            }
        } catch (error) {
            console.error('[AdminPage] Error:', error);
            setHasAccess(false);
        }
    };

    const fetchOrgTasks = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/tasks', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setOrgTasks(data.tasks || []);
            }
        } catch (error) {
            console.error('Failed to fetch org tasks:', error);
        }
    };

    const calculateStats = (usersData) => {
        const activeUsers = usersData.filter(u => u.is_active).length;
        const drafts7d = usersData.reduce((sum, u) => sum + parseInt(u.drafts_7d || 0), 0);
        const openTasks = usersData.reduce((sum, u) => sum + parseInt(u.tasks_count || 0), 0);

        setStats({
            activeUsers,
            drafts7d,
            openTasks,
            emails7d: 0,
        });
    };

    const fetchActivity = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/activity', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setActivities(data.activities);
            }
        } catch (error) {
            console.error('Failed to fetch activity:', error);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newUser),
            });

            if (res.ok) {
                setShowCreateUserModal(false);
                setNewUser({
                    email: '',
                    password: '',
                    firstName: '',
                    lastName: '',
                    role: 'member',
                    isAdmin: false,
                });
                checkAccess();
                alert('User created successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create user');
            }
        } catch (error) {
            alert('Failed to create user');
        }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/tasks', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newTask),
            });

            if (res.ok) {
                setShowCreateTaskModal(false);
                setNewTask({
                    title: '',
                    description: '',
                    priority: 'medium',
                    dueDate: '',
                    assignedTo: '',
                });
                fetchOrgTasks();
                alert('Task created successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create task');
            }
        } catch (error) {
            alert('Failed to create task');
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: resetPassword.userId,
                    newPassword: resetPassword.newPassword,
                }),
            });

            if (res.ok) {
                setShowResetPasswordModal(false);
                setResetPassword({ userId: '', newPassword: '' });
                setSelectedUser(null);
                alert('Password reset successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to reset password');
            }
        } catch (error) {
            alert('Failed to reset password');
        }
    };

    const handleDeleteUser = async (userId, userEmail) => {
        if (!confirm(`Are you sure you want to remove ${userEmail} from the organization?`)) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/users?userId=${userId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                checkAccess();
                alert('User removed successfully!');
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to remove user');
            }
        } catch (error) {
            alert('Failed to remove user');
        }
    };

    const toggleUserStatus = async (userId, currentStatus) => {
        try {
            const token = localStorage.getItem('auth_token');
            await fetch('/api/admin/users', {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    isActive: !currentStatus,
                }),
            });

            checkAccess();
        } catch (error) {
            console.error('Failed to update user:', error);
        }
    };

    const openResetPasswordModal = (user) => {
        setSelectedUser(user);
        setResetPassword({ userId: user.id, newPassword: '' });
        setShowResetPasswordModal(true);
    };

    const openTierModal = async (user) => {
        setSelectedUserForTier(user);
        setTierUserLoading(true);
        setTierMessage('');
        setSelectedTier('free');

        try {
            const token = localStorage.getItem('auth_token');
            const res = await fetch(`/api/admin/users/tier?userId=${user.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                setSelectedTier(data.tierInfo.current_tier);
            }
        } catch (error) {
            console.error('Failed to load tier:', error);
        } finally {
            setTierUserLoading(false);
            setShowTierModal(true);
        }
    };

    const handleUpdateUserTier = async (e) => {
        e.preventDefault();
        if (!selectedUserForTier) return;

        try {
            setTierUserLoading(true);
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/users/tier', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: selectedUserForTier.id,
                    newTier: selectedTier,
                }),
            });

            if (res.ok) {
                setTierMessage('✓ Tier updated successfully');
                setTimeout(() => {
                    setShowTierModal(false);
                    checkAccess();
                }, 1000);
            } else {
                const data = await res.json();
                setTierMessage(`✗ ${data.error || 'Failed to update tier'}`);
            }
        } catch (error) {
            setTierMessage(`✗ ${error.message}`);
        } finally {
            setTierUserLoading(false);
        }
    };

    const handleCancelUserSubscription = async () => {
        if (!selectedUserForTier) return;
        if (!confirm('Cancel this user\'s subscription? They will revert to FREE tier.')) return;

        try {
            setTierUserLoading(true);
            const token = localStorage.getItem('auth_token');
            const res = await fetch('/api/admin/users/tier/cancel', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId: selectedUserForTier.id }),
            });

            if (res.ok) {
                setTierMessage('✓ Subscription cancelled');
                setTimeout(() => {
                    setShowTierModal(false);
                    checkAccess();
                }, 1000);
            } else {
                const data = await res.json();
                setTierMessage(`✗ ${data.error || 'Failed to cancel'}`);
            }
        } catch (error) {
            setTierMessage(`✗ ${error.message}`);
        } finally {
            setTierUserLoading(false);
        }
    };

    const getActivityIcon = (type) => {
        const icons = {
            user_created: '👤',
            email_connected: '📧',
            email_synced: '🔄',
            email_classified: '🏷️',
            draft_generated: '✍️',
            bulk_drafts_generated: '📝',
            voice_profile_trained: '🎤',
            user_signin: '🔑',
            task_created: '📋',
            password_reset: '🔐',
        };
        return icons[type] || '📌';
    };

    const getPriorityColor = (priority) => {
        const colors = {
            urgent: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
            high: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
            medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400',
            low: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        };
        return colors[priority] || colors.medium;
    };

    if (hasAccess === null) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-gray-600 dark:text-gray-400 font-inter">Loading...</p>
            </div>
        );
    }

    if (hasAccess === false) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-6">
                    <Shield className="h-10 w-10 text-red-600 dark:text-red-400" />
                </div>
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Admin Access Required
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    You don't have permission to access this page
                </p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-sora font-bold text-black dark:text-white mb-2">
                    Admin Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400 font-inter">
                    Manage users and monitor platform activity for {organization?.name}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-inter">Active Users</span>
                    </div>
                    <p className="text-3xl font-sora font-bold text-black dark:text-white">
                        {stats.activeUsers} / {organization?.max_users || 0}
                    </p>
                </div>

                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-inter">Drafts (7d)</span>
                    </div>
                    <p className="text-3xl font-sora font-bold text-black dark:text-white">
                        {stats.drafts7d}
                    </p>
                </div>

                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-inter">Open Tasks</span>
                    </div>
                    <p className="text-3xl font-sora font-bold text-black dark:text-white">
                        {stats.openTasks}
                    </p>
                </div>

                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400 font-inter">Emails (7d)</span>
                    </div>
                    <p className="text-3xl font-sora font-bold text-black dark:text-white">
                        {stats.emails7d}
                    </p>
                </div>
            </div>

            {/* Organization Tasks */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-sora font-bold text-black dark:text-white">
                        Outstanding Tasks Across Organization
                    </h2>
                    <button
                        onClick={() => setShowCreateTaskModal(true)}
                        className="px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-medium hover:scale-[0.98] transition-transform flex items-center gap-2"
                    >
                        <ListTodo className="h-4 w-4" />
                        Create Task
                    </button>
                </div>
                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] overflow-hidden">
                    {orgTasks.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-gray-400">No outstanding tasks</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-[#E6E6E6] dark:divide-[#333333]">
                            {orgTasks.map((task) => (
                                <div key={task.id} className="p-4 hover:bg-[#F9F9F9] dark:hover:bg-[#252525] transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-plus-jakarta font-semibold text-black dark:text-white">
                                                    {task.title}
                                                </h3>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-plus-jakarta font-semibold ${getPriorityColor(task.priority)}`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                            {task.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mb-2">
                                                    {task.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500 font-inter">
                                                <span>Assigned to: {task.user_email}</span>
                                                {task.due_date && (
                                                    <span>Due: {new Date(task.due_date).toLocaleDateString()}</span>
                                                )}
                                                <span className="capitalize">Status: {task.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid lg:grid-cols-2 gap-8">
                {/* Team Members */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-sora font-bold text-black dark:text-white">
                            Team Members
                        </h2>
                        <button
                            onClick={() => setShowCreateUserModal(true)}
                            className="px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-medium hover:scale-[0.98] transition-transform flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Create User
                        </button>
                    </div>

                    <div className="space-y-4">
                        {users.map((user) => (
                            <div
                                key={user.id}
                                className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center flex-shrink-0">
                                        <span className="text-white font-sora font-bold text-lg">
                                            {user.email[0].toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="font-plus-jakarta font-semibold text-black dark:text-white">
                                                {user.first_name && user.last_name
                                                    ? `${user.first_name} ${user.last_name}`
                                                    : user.email}
                                            </p>
                                            {user.is_admin && (
                                                <span className="px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 text-xs font-plus-jakarta font-semibold">
                                                    Admin
                                                </span>
                                            )}
                                            {!user.is_active && (
                                                <span className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-plus-jakarta font-semibold">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mb-2">
                                            {user.email}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500 font-inter">
                                            {user.drafts_7d} drafts · {user.tasks_count} tasks · {user.actions_7d} actions (7d)
                                        </p>
                                    </div>

                                    <div className="relative" data-dropdown>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                console.log('Admin dropdown clicked, current ID:', openDropdownId, 'User ID:', user.id);
                                                setOpenDropdownId(openDropdownId === user.id ? null : user.id);
                                            }}
                                            className="p-2 rounded-full hover:bg-[#F3F3F3] dark:hover:bg-[#333333] transition-colors"
                                        >
                                            <MoreVertical className="h-5 w-5 text-gray-400" />
                                        </button>
                                        {openDropdownId === user.id && (
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-[#1E1E1E] border border-[#E6E6E6] dark:border-[#333333] rounded-xl shadow-2xl z-50">
                                                <button
                                                    onClick={() => {
                                                        setOpenDropdownId(null);
                                                        openResetPasswordModal(user);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm font-inter text-black dark:text-white hover:bg-[#F3F3F3] dark:hover:bg-[#333333] flex items-center gap-2 rounded-t-xl"
                                                >
                                                    <Key className="h-4 w-4" />
                                                    Reset Password
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setOpenDropdownId(null);
                                                        toggleUserStatus(user.id, user.is_active);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm font-inter text-black dark:text-white hover:bg-[#F3F3F3] dark:hover:bg-[#333333] flex items-center gap-2"
                                                >
                                                    {user.is_active ? 'Deactivate' : 'Activate'}
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setOpenDropdownId(null);
                                                        handleDeleteUser(user.id, user.email);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm font-inter text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-xl"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Remove User
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div>
                    <h2 className="text-2xl font-sora font-bold text-black dark:text-white mb-6">
                        Activity Feed
                    </h2>

                    <div className="space-y-4">
                        {activities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-4 rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] p-6"
                            >
                                <div className="text-2xl flex-shrink-0">
                                    {getActivityIcon(activity.activity_type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-plus-jakarta font-medium text-black dark:text-white mb-1">
                                        {activity.first_name || activity.email}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mb-1">
                                        {activity.description}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 font-inter">
                                        {new Date(activity.created_at).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Tier Management Section */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-sora font-bold text-black dark:text-white flex items-center gap-3">
                        <CreditCard className="h-6 w-6" />
                        Tier Management
                    </h2>
                </div>
                <div className="rounded-2xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] overflow-hidden">
                    <div className="divide-y divide-[#E6E6E6] dark:divide-[#333333]">
                        {users.length === 0 ? (
                            <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                                No users found
                            </div>
                        ) : (
                            users.map((user) => (
                                <div key={user.id} className="p-4 hover:bg-[#F9F9F9] dark:hover:bg-[#252525] transition-colors flex items-center justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-plus-jakarta font-semibold text-black dark:text-white">
                                                {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 font-inter">
                                            {user.email}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => openTierModal(user)}
                                        className="px-4 py-2 rounded-lg bg-blue-600 dark:bg-blue-600 text-white font-plus-jakarta text-sm font-semibold hover:bg-blue-700 transition-colors flex-shrink-0 ml-4"
                                    >
                                        Manage Tier
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreateUserModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
                    onClick={() => setShowCreateUserModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E6E6E6] dark:border-[#333333] max-w-md w-full p-8 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-sora font-bold text-black dark:text-white">
                                Create User
                            </h2>
                            <button
                                onClick={() => setShowCreateUserModal(false)}
                                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="user@company.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newUser.firstName}
                                        onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        value={newUser.lastName}
                                        onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    Password *
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="Min. 8 characters"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    Role
                                </label>
                                <select
                                    value={newUser.role}
                                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                >
                                    <option value="member">Member</option>
                                    <option value="manager">Manager</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isAdmin"
                                    checked={newUser.isAdmin}
                                    onChange={(e) => setNewUser({ ...newUser, isAdmin: e.target.checked })}
                                    className="w-4 h-4 rounded border-[#E6E6E6] dark:border-[#333333]"
                                />
                                <label htmlFor="isAdmin" className="text-sm font-inter text-black dark:text-white">
                                    Grant admin access
                                </label>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform"
                            >
                                Create User
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Task Modal */}
            {showCreateTaskModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
                    onClick={() => setShowCreateTaskModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E6E6E6] dark:border-[#333333] max-w-md w-full p-8 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-sora font-bold text-black dark:text-white">
                                Create Task
                            </h2>
                            <button
                                onClick={() => setShowCreateTaskModal(false)}
                                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    Task Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={newTask.title}
                                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="Complete project proposal"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={newTask.description}
                                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                                    rows={3}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="Task details..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                        Priority
                                    </label>
                                    <select
                                        value={newTask.priority}
                                        onChange={(e) => setNewTask({ ...newTask, priority: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                        Due Date
                                    </label>
                                    <input
                                        type="date"
                                        value={newTask.dueDate}
                                        onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    Assign To
                                </label>
                                <select
                                    value={newTask.assignedTo}
                                    onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                >
                                    <option value="">Select user...</option>
                                    {users.filter(u => u.is_active).map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.first_name && user.last_name
                                                ? `${user.first_name} ${user.last_name}`
                                                : user.email}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform"
                            >
                                Create Task
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Tier Management Modal */}
            {showTierModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
                    onClick={() => setShowTierModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E6E6E6] dark:border-[#333333] max-w-md w-full p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-sora font-bold text-black dark:text-white">
                                Manage Tier
                            </h2>
                            <button
                                onClick={() => setShowTierModal(false)}
                                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {selectedUserForTier && (
                            <form onSubmit={handleUpdateUserTier} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                        User
                                    </label>
                                    <div className="px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-[#F9F9F9] dark:bg-[#0A0A0A] text-black dark:text-white font-inter text-sm">
                                        {selectedUserForTier.email}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                        Tier *
                                    </label>
                                    <select
                                        value={selectedTier}
                                        onChange={(e) => setSelectedTier(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    >
                                        {Object.values(TIERS).map((tier) => (
                                            <option key={tier} value={tier}>
                                                {getTierConfig(tier).name}
                                            </option>
                                        ))}
                                    </select>
                                </div>


                                {tierMessage && (
                                    <div className={`rounded-xl p-3 text-sm ${tierMessage.startsWith('✓') ? 'bg-green-500/15 text-green-300' : 'bg-red-500/15 text-red-300'}`}>
                                        {tierMessage}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <button
                                        type="submit"
                                        disabled={tierUserLoading}
                                        className="w-full py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform disabled:opacity-60"
                                    >
                                        {tierUserLoading ? 'Updating...' : 'Update Tier'}
                                    </button>

                                    {selectedTier !== 'free' && (
                                        <button
                                            type="button"
                                            onClick={handleCancelUserSubscription}
                                            disabled={tierUserLoading}
                                            className="w-full py-3 rounded-full bg-red-600/20 text-red-400 font-plus-jakarta font-semibold hover:bg-red-600/30 transition-colors disabled:opacity-60"
                                        >
                                            {tierUserLoading ? 'Cancelling...' : 'Cancel Subscription'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetPasswordModal && (
                <div
                    className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6"
                    onClick={() => setShowResetPasswordModal(false)}
                >
                    <div
                        className="bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E6E6E6] dark:border-[#333333] max-w-md w-full p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-sora font-bold text-black dark:text-white">
                                Reset Password
                            </h2>
                            <button
                                onClick={() => setShowResetPasswordModal(false)}
                                className="text-gray-400 hover:text-black dark:hover:text-white transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <p className="text-sm text-gray-600 dark:text-gray-400 font-inter mb-6">
                            Reset password for: <strong>{selectedUser?.email}</strong>
                        </p>

                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div>
                                <label className="block text-sm font-plus-jakarta font-medium text-black dark:text-white mb-2">
                                    New Password *
                                </label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={resetPassword.newPassword}
                                    onChange={(e) => setResetPassword({ ...resetPassword, newPassword: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#0A0A0A] text-black dark:text-white font-inter focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                    placeholder="Min. 8 characters"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 rounded-full bg-black dark:bg-white text-white dark:text-black font-plus-jakarta font-semibold hover:scale-[0.98] transition-transform"
                            >
                                Reset Password
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
