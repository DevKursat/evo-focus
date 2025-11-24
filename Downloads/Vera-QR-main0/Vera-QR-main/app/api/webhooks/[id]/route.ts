import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

// GET /api/webhooks/[id] - Get webhook config details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const supabase = createClient()

    const { data: webhook, error } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !webhook) {
      return NextResponse.json(
        { error: error?.message || 'Webhook not found' },
        { status: error ? 500 : 404 }
      )
    }

    // Don't expose secret_key
    return NextResponse.json({
      webhook: {
        ...webhook,
        secret_key: undefined,
      },
    })
  } catch (error: any) {
    console.error('Webhook Fetch Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

// PATCH /api/webhooks/[id] - Update webhook config
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    
    const {
      name,
      url,
      events,
      custom_headers,
      is_active,
      retry_enabled,
      max_retries,
      timeout_seconds,
      regenerate_secret,
    } = body

    const supabase = createClient()

    // Build update object
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (url !== undefined) updateData.url = url
    if (events !== undefined) updateData.events = events
    if (custom_headers !== undefined) updateData.custom_headers = custom_headers
    if (is_active !== undefined) updateData.is_active = is_active
    if (retry_enabled !== undefined) updateData.retry_enabled = retry_enabled
    if (max_retries !== undefined) updateData.max_retries = max_retries
    if (timeout_seconds !== undefined) updateData.timeout_seconds = timeout_seconds

    // Regenerate secret key if requested
    let newSecretKey: string | undefined
    if (regenerate_secret === true) {
      newSecretKey = crypto.randomBytes(32).toString('hex')
      updateData.secret_key = newSecretKey
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Update webhook
    const { data: webhook, error } = await supabase
      .from('webhook_configs')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error || !webhook) {
      return NextResponse.json(
        { error: error?.message || 'Webhook not found' },
        { status: error ? 500 : 404 }
      )
    }

    const response: any = {
      webhook: {
        ...webhook,
        secret_key: undefined,
      },
      message: 'Webhook updated successfully',
    }

    // Return new secret key only if regenerated
    if (newSecretKey) {
      response.new_secret_key = newSecretKey
      response.message += '. New secret key generated. Save it securely.'
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Webhook Update Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

// DELETE /api/webhooks/[id] - Delete webhook config
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const supabase = createClient()

    const { error } = await supabase
      .from('webhook_configs')
      .delete()
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({
      message: 'Webhook deleted successfully',
    })
  } catch (error: any) {
    console.error('Webhook Delete Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
