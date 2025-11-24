import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendWebhook, generateWebhookSignature } from '@/lib/webhook'

// POST /api/webhooks/test - Test a webhook configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { webhook_config_id, test_payload } = body

    if (!webhook_config_id) {
      return NextResponse.json(
        { error: 'webhook_config_id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Fetch webhook config
    const { data: config, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('id', webhook_config_id)
      .maybeSingle()

    if (error || !config) {
      return NextResponse.json(
        { error: error?.message || 'Webhook config not found' },
        { status: error ? 500 : 404 }
      )
    }

    // Create test payload
    const payload = test_payload || {
      event: 'webhook.test',
      timestamp: new Date().toISOString(),
      organization_id: config.organization_id,
      data: {
        test: true,
        message: 'This is a test webhook from VERAQR',
      },
      metadata: {
        webhook_config_id: config.id,
        webhook_name: config.name,
      },
    }

    // Send webhook
    const result = await sendWebhook(config as any, payload, 1)

    // Log the test delivery
    const payloadString = JSON.stringify(payload)
    const signature = generateWebhookSignature(payloadString, config.secret_key)

    await supabase.from('webhook_logs').insert({
      webhook_config_id: config.id,
      organization_id: config.organization_id,
      event_type: 'webhook.test',
      event_id: crypto.randomUUID(),
      request_url: config.url,
      request_method: 'POST',
      request_headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': 'webhook.test',
        'X-Webhook-Signature': signature,
      },
      request_body: payload,
      request_signature: signature,
      response_status: result.statusCode,
      response_body: result.responseBody,
      response_time_ms: result.responseTimeMs,
      status: result.success ? 'success' : 'failed',
      attempt_number: 1,
      error_message: result.error,
      delivered_at: result.success ? new Date().toISOString() : null,
    })

    return NextResponse.json({
      success: result.success,
      statusCode: result.statusCode,
      responseBody: result.responseBody,
      responseTimeMs: result.responseTimeMs,
      error: result.error,
      message: result.success
        ? 'Webhook test successful'
        : 'Webhook test failed',
    })
  } catch (error: any) {
    console.error('Webhook Test Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
