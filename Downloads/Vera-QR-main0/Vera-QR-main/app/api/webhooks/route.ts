import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

// GET /api/webhooks - List all webhook configs for organization
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organization_id')

    if (!organizationId) {
      return NextResponse.json(
        { error: 'organization_id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: webhooks, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    // Don't expose secret_key in the response
    const sanitizedWebhooks = webhooks?.map(webhook => ({
      ...webhook,
      secret_key: undefined,
    }))

    return NextResponse.json({ webhooks: sanitizedWebhooks })
  } catch (error: any) {
    console.error('Webhook List Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

// POST /api/webhooks - Create new webhook config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      organization_id,
      name,
      url,
      events = ['order.created', 'order.updated', 'order.completed'],
      custom_headers = {},
      timeout_seconds = 30,
      max_retries = 3,
    } = body

    // Validate required fields
    if (!organization_id || !name || !url) {
      return NextResponse.json(
        { error: 'organization_id, name, and url are required' },
        { status: 400 }
      )
    }

    // Validate URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json(
        { error: 'URL must start with http:// or https://' },
        { status: 400 }
      )
    }

    // Generate secret key
    const secretKey = crypto.randomBytes(32).toString('hex')

    const supabase = createClient()

    // Create webhook config
    const { data: webhook, error } = await supabase
      .from('webhook_configs')
      .insert({
        organization_id,
        name,
        url,
        secret_key: secretKey,
        events,
        custom_headers,
        timeout_seconds,
        max_retries,
        is_active: true,
        retry_enabled: true,
      })
      .select()
      .maybeSingle()

    if (error || !webhook) {
      return NextResponse.json(
        { error: error?.message || 'Failed to create webhook' },
        { status: error ? 500 : 400 }
      )
    }

    return NextResponse.json(
      {
        webhook: {
          ...webhook,
          secret_key: secretKey, // Return secret only on creation
        },
        message: 'Webhook created successfully. Save the secret_key securely, it will not be shown again.',
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Webhook Creation Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
