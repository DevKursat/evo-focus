import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

/**
 * Health Check Endpoint
 * - Verifies Supabase connection
 * - Returns system status
 * - Called by GitHub Actions every 5 minutes
 */
export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { 
          status: 'error', 
          message: 'Missing Supabase configuration',
          timestamp: new Date().toISOString()
        },
        { status: 500 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test database connection
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is OK
      throw error;
    }

    // Get database stats
    const { count: orgCount } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      status: 'healthy',
      message: 'VERAQR system operational',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        organizations: orgCount || 0,
        orders: orderCount || 0
      },
      environment: process.env.NODE_ENV || 'production'
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
