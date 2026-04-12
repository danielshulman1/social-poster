'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getUserSocialConnections } from '@/lib/supabase';
import { ProtectedLayout } from '@/components/protected-layout';
import { ArrowLeft, Facebook, Linkedin, Instagram, Check, X, Loader } from 'lucide-react';

interface SocialConnection {
  id: string;
  platform: 'facebook' | 'instagram' | 'linkedin';
  platform_user_id: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [connections, setConnections] = useState<SocialConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

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

        // Load social connections
        const conns = await getUserSocialConnections(user.id);
        setConnections(conns);
      } catch (error) {
        console.error('Error loading settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  const handleConnectSocial = async (platform: 'facebook' | 'instagram' | 'linkedin') => {
    setConnecting(platform);
    try {
      const response = await fetch('/api/oauth/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });

      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      console.error(`Failed to connect ${platform}:`, error);
      alert(`Failed to connect to ${platform}. Please try again.`);
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platform: string) => {
    if (!confirm(`Disconnect from ${platform}?`)) return;

    try {
      const { error } = await supabase
        .from('user_social_connections')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', platform);

      if (error) throw error;

      setConnections(connections.filter((c) => c.platform !== platform));
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('Failed to disconnect. Please try again.');
    }
  };

  const isConnected = (platform: string) => connections.some((c) => c.platform === platform);

  const platforms = [
    {
      name: 'Facebook',
      id: 'facebook',
      icon: Facebook,
      color: 'blue',
      description: 'Import posts and analyze engagement from Facebook',
    },
    {
      name: 'Instagram',
      id: 'instagram',
      icon: Instagram,
      color: 'pink',
      description: 'Import posts and analyze engagement from Instagram',
    },
    {
      name: 'LinkedIn',
      id: 'linkedin',
      icon: Linkedin,
      color: 'blue',
      description: 'Import posts and analyze engagement from LinkedIn',
    },
  ];

  if (loading) {
    return <ProtectedLayout><div>Loading...</div></ProtectedLayout>;
  }

  return (
    <ProtectedLayout>
      <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white">
          <div className="max-w-4xl mx-auto px-4 py-6 flex items-center gap-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">Manage your social media connections</p>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-12">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Connect Social Media Accounts</h2>

            <div className="space-y-4">
              {platforms.map((platform) => {
                const Icon = platform.icon;
                const connected = isConnected(platform.id);

                return (
                  <div
                    key={platform.id}
                    className="bg-white rounded-lg border border-gray-200 p-6 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-3 rounded-full ${
                          platform.color === 'blue' ? 'bg-blue-100' : 'bg-pink-100'
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${
                            platform.color === 'blue' ? 'text-blue-600' : 'text-pink-600'
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{platform.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {connected && (
                        <div className="flex items-center gap-2 text-green-600">
                          <Check className="w-5 h-5" />
                          <span className="text-sm font-medium">Connected</span>
                        </div>
                      )}

                      {connected ? (
                        <button
                          onClick={() => handleDisconnect(platform.id)}
                          className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnectSocial(platform.id as any)}
                          disabled={connecting === platform.id}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {connecting === platform.id ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Connecting...
                            </>
                          ) : (
                            'Connect'
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info Box */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">Why connect your accounts?</h3>
              <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                <li>We'll automatically import your past posts to analyze your writing style</li>
                <li>Your AI persona will be trained on your actual content</li>
                <li>Generate new posts that perfectly match your voice</li>
                <li>We never post without your permission</li>
              </ul>
            </div>
          </section>
        </main>
      </div>
    </ProtectedLayout>
  );
}
