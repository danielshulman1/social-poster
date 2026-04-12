import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's social connections
    const { data, error } = await supabase
      .from('user_social_connections')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ connections: data || [] });
  } catch (error) {
    console.error('Error fetching connections:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
