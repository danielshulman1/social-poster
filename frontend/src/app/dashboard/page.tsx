'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getUserPersona, getUserSocialConnections } from '@/lib/supabase';
import { ProtectedLayout } from '@/components/protected-layout';
import { Wand2, LogOut, Settings, Zap, RotateCcw } from 'lucide-react';

interface UserPersona {
  id: string;
  brandVoiceSummary: string;
  contentPillars: string[];
  created_at: string;
}

interface SocialConnection {
  platform: string;
  platform_user_id: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [persona, setPersona] = useState<UserPersona | null>(null);
  const [socials, setSocials] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminReset, setShowAdminReset] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/login');
          return;
        }

        setUser(user);

        // Check if user is admin (using user metadata or email)
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',');
        const userIsAdmin = adminEmails.includes(user.email || '');
        setIsAdmin(userIsAdmin);

        // Load persona
        const personaData = await getUserPersona(user.id);
        if (personaData) {
          setPersona(personaData.persona_data);
        }

        // Load social connections
        const connections = await getUserSocialConnections(user.id);
        setSocials(connections.map((c) => ({ platform: c.platform, platform_user_id: c.platform_user_id })));
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleCreatePersona = () => {
    router.push('/onboarding');
  };

  const handleGoToSettings = () => {
    router.push('/settings');
  };

  const handleResetPersona = async () => {
    if (!window.confirm('Delete this persona? Users will be able to create a new one.')) {
      return;
    }

    setResetting(true);
    try {
      const { error } = await supabase
        .from('user_personas')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setPersona(null);
      setShowAdminReset(false);
    } catch (error) {
      console.error('Error resetting persona:', error);
      alert('Failed to reset persona');
    } finally {
      setResetting(false);
    }
  };

  if (loading) {
    return <ProtectedLayout><div>Loading...</div></ProtectedLayout>;
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-6 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome, {user?.email}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleGoToSettings}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-12">
          {/* Connected Socials */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Connected Social Accounts</h2>
            {socials.length > 0 ? (
              <div className="grid md:grid-cols-3 gap-4">
                {socials.map((social) => (
                  <div key={social.platform} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize">{social.platform}</h3>
                        <p className="text-sm text-gray-600 mt-1">✓ Connected</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                        <span className="text-green-600 font-bold">✓</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <p className="text-blue-900 mb-4">No social accounts connected yet</p>
                <button
                  onClick={handleGoToSettings}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Connect Social Accounts
                </button>
              </div>
            )}
          </section>

          {/* Persona Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Your AI Persona</h2>
            {persona ? (
              <div className="bg-white rounded-lg border border-gray-200 p-8">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Brand Voice</h3>
                  <p className="text-gray-700">{persona.brandVoiceSummary}</p>
                </div>

                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Content Pillars</h3>
                  <div className="flex flex-wrap gap-2">
                    {persona.contentPillars?.map((pillar, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {pillar}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <p className="text-sm text-gray-500">
                    Created: {new Date(persona.created_at).toLocaleDateString()}
                  </p>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAdminReset(!showAdminReset)}
                      className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                    >
                      Admin: Reset Persona
                    </button>
                  )}
                </div>

                {/* Admin Reset Confirmation */}
                {isAdmin && showAdminReset && (
                  <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-900 mb-3">
                      This will delete the persona and allow the user to create a new one.
                    </p>
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => setShowAdminReset(false)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleResetPersona}
                        disabled={resetting}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        {resetting ? (
                          <>
                            <span className="animate-spin">⟳</span>
                            Resetting...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            Delete Persona
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
                <Wand2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Persona Yet</h3>
                <p className="text-gray-600 mb-6">
                  Create your AI-powered brand persona based on your interview and social media posts.
                </p>
                <button
                  onClick={handleCreatePersona}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <Zap className="w-5 h-5" />
                  Create AI Persona
                </button>
              </div>
            )}
          </section>
        </main>
      </div>
    </ProtectedLayout>
  );
}
