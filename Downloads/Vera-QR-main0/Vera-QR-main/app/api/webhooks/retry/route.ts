import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { retryFailedWebhooks } from '@/lib/webhook'
import { Database } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

// This endpoint should be called by a cron job (e.g., Vercel Cron or GitHub Actions)
// GET /api/webhooks/retry
export async function GET(request: NextRequest) {
  try {
    // Verify authorization (use a secret token for cron jobs)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-token-here'
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase client with service role key
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Retry failed webhooks
    await retryFailedWebhooks(supabase)

    return NextResponse.json({
      success: true,
      message: 'Webhook retry job completed',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Webhook Retry Job Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
