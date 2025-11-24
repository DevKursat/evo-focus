import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/webhooks/logs - Get webhook delivery logs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organization_id')
    const webhookConfigId = searchParams.get('webhook_config_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    let query = supabase
      .from('webhook_logs')
      .select('*, webhook_configs(name, url)')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(Math.min(limit, 100))

    if (webhookConfigId) {
      query = query.eq('webhook_config_id', webhookConfigId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: logs, error } = await query

    if (error) {
      throw error
    }

    // Calculate statistics
    const stats = {
      total: logs?.length || 0,
      success: logs?.filter(l => l.status === 'success').length || 0,
      failed: logs?.filter(l => l.status === 'failed').length || 0,
      retrying: logs?.filter(l => l.status === 'retrying').length || 0,
      avgResponseTime: logs?.length
        ? Math.round(
            logs.reduce((sum, l) => sum + (l.response_time_ms || 0), 0) / logs.length
          )
        : 0,
    }

    return NextResponse.json({
      logs,
      stats,
    })
  } catch (error: any) {
    console.error('Webhook Logs Fetch Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
