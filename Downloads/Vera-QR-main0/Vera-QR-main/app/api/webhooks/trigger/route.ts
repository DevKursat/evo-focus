import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Trigger webhook for a restaurant when an event occurs
 * This is a simplified version that uses the webhook_url from restaurants table
 */
export async function POST(request: NextRequest) {
  try {
    const { restaurantId, event, data } = await request.json()

    if (!restaurantId || !event || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: restaurantId, event, data' },
        { status: 400 }
      )
    }

    // Create Supabase client with service role for server-side operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Get restaurant webhook URL
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('webhook_url')
      .eq('id', restaurantId)
      .single()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    if (!restaurant.webhook_url) {
      // No webhook configured, silently succeed
      return NextResponse.json({ success: true, message: 'No webhook configured' })
    }

    // Prepare webhook payload
    const payload = {
      event,
      timestamp: new Date().toISOString(),
      restaurant_id: restaurantId,
      data,
    }

    // Send webhook
    const webhookResponse = await fetch(restaurant.webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VERAQR-Webhook/1.0',
        'X-Webhook-Event': event,
        'X-Webhook-Timestamp': payload.timestamp,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!webhookResponse.ok) {
      console.error('Webhook delivery failed:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook delivery failed',
          status: webhookResponse.status,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook delivered successfully',
      status: webhookResponse.status,
    })
  } catch (error: any) {
    console.error('Webhook trigger error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
