import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// OAuth callback handler for all social platforms
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');
  const platform = searchParams.get('platform') || 'unknown';

  if (error) {
    return NextResponse.redirect(
      new URL(`/onboarding?step=posts&error=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/onboarding?step=posts&error=invalid_request', request.url)
    );
  }

  try {
    // Verify state and exchange code for token
    const tokenResponse = await fetch('https://graph.instagram.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_APP_ID!,
        client_secret: process.env.INSTAGRAM_APP_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback`,
        code,
      }).toString(),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenData.access_token) {
      throw new Error('Failed to get access token');
    }

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(
        new URL('/onboarding?step=posts&error=not_authenticated', request.url)
      );
    }

    // Save social connection
    await supabase.from('user_social_connections').upsert(
      {
        user_id: user.id,
        platform: platform as 'facebook' | 'instagram' | 'linkedin',
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        platform_user_id: tokenData.user_id,
      },
      { onConflict: 'user_id, platform' }
    );

    // Redirect back to onboarding
    return NextResponse.redirect(
      new URL(
        `/onboarding?step=posts&platform=${platform}&success=true`,
        request.url
      )
    );
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(
      new URL(
        `/onboarding?step=posts&error=${encodeURIComponent(error instanceof Error ? error.message : 'Unknown error')}`,
        request.url
      )
    );
  }
}
