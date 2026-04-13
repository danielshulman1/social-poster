'use client';

import { useState } from 'react';
import { CollectedPost } from '@/lib/supabase';
import { Upload, FileText, Link2, Plus, Trash2 } from 'lucide-react';

interface PostsStepProps {
  onComplete: (posts: CollectedPost[]) => void;
  initialPosts?: CollectedPost[];
  onProgress?: (progress: number) => void;
}

export function PostsStep({ onComplete, initialPosts = [], onProgress }: PostsStepProps) {
  const [posts, setPosts] = useState<CollectedPost[]>(initialPosts);
  const [activeTab, setActiveTab] = useState<'manual' | 'oauth'>('manual');
  const [manualInput, setManualInput] = useState('');
  const [connectedPlatforms, setConnectedPlatforms] = useState<string[]>([]);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddManualPost = () => {
    if (manualInput.trim()) {
      const newPost: CollectedPost = {
        content: manualInput,
        datePosted: new Date().toISOString(),
      };
      const updated = [...posts, newPost];
      setPosts(updated);
      setManualInput('');
      onProgress?.((updated.length / 10) * 100);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const lines = content.split('\n').filter((line) => line.trim());

      const newPosts = lines.map((line) => ({
        content: line.trim(),
        datePosted: new Date().toISOString(),
      }));

      const updated = [...posts, ...newPosts];
      setPosts(updated);
      onProgress?.((Math.min(updated.length, 10) / 10) * 100);
    };

    reader.readAsText(file);
  };

  const handleRemovePost = (index: number) => {
    const updated = posts.filter((_, i) => i !== index);
    setPosts(updated);
  };

  const handleConnectSocial = async (platform: 'facebook' | 'instagram' | 'linkedin') => {
    setIsConnecting(platform);
    try {
      // This would typically initiate OAuth flow
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
    } finally {
      setIsConnecting(null);
    }
  };

  const handleSkip = () => {
    onComplete(posts);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 p-4 sm:p-6">
      <div className="w-full max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Analyze Your Existing Posts
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Help us understand your writing style by showing us what you've posted before
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 sm:gap-4 mb-6 sm:mb-8 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-3 sm:px-4 py-2 sm:py-3 font-medium border-b-2 transition-colors whitespace-nowrap text-xs sm:text-base ${
              activeTab === 'manual'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="inline mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Manual Upload</span>
            <span className="sm:hidden">Upload</span>
          </button>
          <button
            onClick={() => setActiveTab('oauth')}
            className={`px-3 sm:px-4 py-2 sm:py-3 font-medium border-b-2 transition-colors whitespace-nowrap text-xs sm:text-base ${
              activeTab === 'oauth'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Link2 className="inline mr-1 sm:mr-2 w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Connect Social Media</span>
            <span className="sm:hidden">Connect</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* Left column - Upload options */}
          <div>
            {activeTab === 'manual' && (
              <div className="space-y-3 sm:space-y-4">
                {/* File upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    <Upload className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-gray-400" />
                    <p className="font-medium text-gray-900 text-sm sm:text-base">Upload posts file</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      .txt or .csv (one post per line)
                    </p>
                  </label>
                </div>

                {/* Manual entry */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    Or paste your posts here
                  </label>
                  <textarea
                    value={manualInput}
                    onChange={(e) => setManualInput(e.target.value)}
                    placeholder="Enter a single post or paste multiple posts (one per line)..."
                    className="w-full p-2 sm:p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-xs sm:text-base"
                    rows={4}
                  />
                  <button
                    onClick={handleAddManualPost}
                    className="mt-2 w-full px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-xs sm:text-base"
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    Add Post
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'oauth' && (
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                  <p className="text-xs sm:text-sm text-blue-900">
                    Connect your social media accounts to automatically import your posts from the
                    last 12 months.
                  </p>
                </div>

                {(['facebook', 'instagram', 'linkedin'] as const).map((platform) => (
                  <button
                    key={platform}
                    onClick={() => handleConnectSocial(platform)}
                    disabled={isConnecting === platform}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center justify-between gap-2 sm:gap-3 text-xs sm:text-base"
                  >
                    <span className="font-medium capitalize">{platform}</span>
                    {connectedPlatforms.includes(platform) ? (
                      <span className="text-green-600 text-xs sm:text-sm whitespace-nowrap">✓ Connected</span>
                    ) : isConnecting === platform ? (
                      <span className="text-blue-600 text-xs sm:text-sm whitespace-nowrap">Connecting...</span>
                    ) : (
                      <span className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">Connect</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right column - Posts preview */}
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
              Posts to analyze ({posts.length})
            </h3>

            <div className="space-y-1 sm:space-y-2 max-h-96 overflow-y-auto bg-gray-50 rounded-lg p-2 sm:p-4">
              {posts.length === 0 ? (
                <p className="text-gray-500 text-center py-6 sm:py-8 text-xs sm:text-base">
                  No posts yet. Upload or connect accounts to get started.
                </p>
              ) : (
                posts.map((post, index) => (
                  <div key={index} className="bg-white p-2 sm:p-3 rounded border border-gray-200 group">
                    <div className="flex justify-between items-start gap-1 sm:gap-2">
                      <p className="text-xs sm:text-sm text-gray-700 flex-1 line-clamp-2">{post.content}</p>
                      <button
                        onClick={() => handleRemovePost(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 flex-shrink-0 p-1"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                    {post.platform && (
                      <span className="text-xs text-gray-500 mt-1 sm:mt-2 capitalize inline-block">{post.platform}</span>
                    )}
                  </div>
                ))
              )}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              We recommend at least 5-10 posts for better analysis
            </p>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
          <button
            onClick={handleSkip}
            className="px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors text-xs sm:text-base"
          >
            Skip for Now
          </button>

          <button
            onClick={() => onComplete(posts)}
            disabled={posts.length === 0}
            className="px-4 sm:px-8 py-2 sm:py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-base"
          >
            Continue to Persona Generation
          </button>
        </div>
      </div>
    </div>
  );
}
