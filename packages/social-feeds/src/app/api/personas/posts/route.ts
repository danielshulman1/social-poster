export const dynamic = 'force-dynamic';

import { NextResponse, NextRequest } from 'next/server';
import { getApiAuthContext, unauthorizedText } from '@/lib/apiAuth';
import { prisma } from '@/lib/prisma';
import { parseConnectionCredentials } from '@/lib/connection-credentials';

/**
 * Fetch recent posts from user's connected social accounts
 * Supports Facebook, Instagram, LinkedIn
 */
export async function GET(req: NextRequest) {
  const auth = await getApiAuthContext(req);
  if (!auth?.userId) return unauthorizedText('Unauthorized');

  try {
    // Get user's external connections (OAuth tokens, etc.)
    const connections = await prisma.externalConnection.findMany({
      where: { userId: auth.userId },
      select: {
        provider: true,
        credentials: true,
      },
    });

    const posts: string[] = [];

    // For each connected platform, try to fetch posts
    for (const conn of connections) {
      try {
        if (conn.provider === 'facebook') {
          const posts_from_fb = await fetchFacebookPosts(conn.credentials);
          posts.push(...posts_from_fb);
        } else if (conn.provider === 'instagram') {
          const posts_from_ig = await fetchInstagramPosts(conn.credentials);
          posts.push(...posts_from_ig);
        } else if (conn.provider === 'linkedin') {
          const posts_from_li = await fetchLinkedInPosts(conn.credentials);
          posts.push(...posts_from_li);
        } else if (conn.provider === 'twitter') {
          const posts_from_tw = await fetchTwitterPosts(conn.credentials);
          posts.push(...posts_from_tw);
        }
      } catch (error) {
        console.error(`Failed to fetch posts from ${conn.provider}:`, error);
        // Continue with other providers
      }
    }

    // Return up to 10 recent posts
    return NextResponse.json({
      posts: posts.slice(0, 10),
      count: posts.length,
    });
  } catch (error: any) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

/**
 * Note: These are placeholder functions. Full implementation would require:
 * 1. Facebook Graph API integration
 * 2. Instagram Graph API integration
 * 3. LinkedIn API integration
 * 4. Twitter/X API integration
 *
 * For now, they return empty arrays. In production, you'd:
 * - Decrypt the stored credentials
 * - Call the platform's API
 * - Parse and return the posts
 */

async function fetchFacebookPosts(credentials: string): Promise<string[]> {
  try {
    const creds = parseConnectionCredentials(credentials);
    const accessToken = creds.access_token || creds.accessToken;

    if (!accessToken) return [];

    // Call Facebook Graph API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/me/posts?access_token=${accessToken}&fields=message,story,created_time&limit=5`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.data || []).map((post: any) => post.message || post.story || '').filter(Boolean);
  } catch (error) {
    console.error('Facebook post fetch failed:', error);
    return [];
  }
}

async function fetchInstagramPosts(credentials: string): Promise<string[]> {
  try {
    const creds = parseConnectionCredentials(credentials);
    const accessToken = creds.access_token || creds.accessToken;

    if (!accessToken) return [];

    // Call Instagram Graph API
    const response = await fetch(
      `https://graph.instagram.com/v18.0/me/media?access_token=${accessToken}&fields=caption,timestamp&limit=5`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.data || []).map((post: any) => post.caption || '').filter(Boolean);
  } catch (error) {
    console.error('Instagram post fetch failed:', error);
    return [];
  }
}

async function fetchLinkedInPosts(credentials: string): Promise<string[]> {
  try {
    const creds = parseConnectionCredentials(credentials);
    const accessToken = creds.access_token || creds.accessToken;

    if (!accessToken) return [];

    // Call LinkedIn API
    const response = await fetch(
      'https://api.linkedin.com/v2/me/posts',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.elements || []).map((post: any) => post.text || '').filter(Boolean);
  } catch (error) {
    console.error('LinkedIn post fetch failed:', error);
    return [];
  }
}

async function fetchTwitterPosts(credentials: string): Promise<string[]> {
  try {
    const creds = parseConnectionCredentials(credentials);
    const accessToken = creds.access_token || creds.accessToken;

    if (!accessToken) return [];

    // Call Twitter/X API v2
    const response = await fetch(
      'https://api.twitter.com/2/users/me/tweets?max_results=5&tweet.fields=created_at',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    return (data.data || []).map((tweet: any) => tweet.text).filter(Boolean);
  } catch (error) {
    console.error('Twitter post fetch failed:', error);
    return [];
  }
}
