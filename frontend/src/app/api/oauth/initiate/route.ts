import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const OAUTH_CONFIG = {
  facebook: {
    clientId: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    scope: 'pages_read_engagement,instagram_business_content_publish,instagram_business_manage_messages',
  },
  instagram: {
    clientId: process.env.INSTAGRAM_APP_ID,
    clientSecret: process.env.INSTAGRAM_APP_SECRET,
    authUrl: 'https://api.instagram.com/oauth/authorize',
    scope: 'user_profile,user_media',
  },
  linkedin: {
    clientId: process.env.LINKEDIN_APP_ID,
    clientSecret: process.env.LINKEDIN_APP_SECRET,
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    scope: 'r_liteprofile,r_basicprofile',
  },
};

export async function POST(request: NextRequest) {
  try {
    const { platform } = await request.json();

    if (!platform || !OAUTH_CONFIG[platform as keyof typeof OAUTH_CONFIG]) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      );
    }

    const config = OAUTH_CONFIG[platform as keyof typeof OAUTH_CONFIG];

    if (!config.clientId) {
      return NextResponse.json(
        { error: `Missing OAuth configuration for ${platform}` },
        { status: 500 }
      );
    }

    // Generate state for CSRF protection
    const state = crypto.randomBytes(16).toString('hex');

    // Store state in secure httpOnly cookie
    const response = NextResponse.json({
      authUrl: new URL(config.authUrl).toString() + '?' + new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/callback?platform=${platform}`,
        response_type: 'code',
        scope: config.scope,
        state,
      }).toString(),
    });

    // Store state for verification in callback
    response.cookies.set({
      name: `oauth_state_${platform}`,
      value: state,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutes
    });

    return response;
  } catch (error) {
    console.error('OAuth initiate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
