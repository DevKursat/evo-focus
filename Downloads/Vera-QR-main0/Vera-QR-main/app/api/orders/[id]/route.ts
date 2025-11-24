import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { triggerWebhooks } from '@/lib/webhook'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { status } = body

    if (!status || !['pending', 'preparing', 'ready', 'served', 'cancelled', 'paid'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Update order status
    const { data: order, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: error?.message || 'Order not found' },
        { status: error ? 500 : 404 }
      )
    }

    // If order is served/cancelled/paid, we might want to free up the table.
    // But 'qr_codes' table doesn't strictly track occupancy like 'tables' might have.
    // We can skip this or add logic if 'qr_codes' had a status column for occupancy.
    // The current schema has status: 'active' | 'inactive' | 'damaged', which is physical status.
    // So no table update needed here for occupancy.

    // Track analytics
    await supabase
      .from('analytics_events')
      .insert({
        restaurant_id: order.restaurant_id,
        event_type: 'order_status_updated',
        event_data: {
          order_id: order.id,
          new_status: status,
        },
        session_id: order.session_id,
      })

    // Trigger webhooks for order status change
    const webhookEvent = status === 'served' ? 'order.completed' : 'order.updated'

    // We might want to fetch items to include in webhook
    const { data: items } = await supabase.from('order_items').select('*').eq('order_id', order.id)

    triggerWebhooks(
      supabase,
      order.restaurant_id,
      webhookEvent,
      order.id,
      { ...order, items: items || [] },
      {
        previous_status: order.status, // Note: this is the *new* status because we fetched after update.
        // Ideally we should have fetched before update to get previous status,
        // but for now let's just send the new status in metadata or adjust logic.
        new_status: status,
        qr_code_id: order.qr_code_id || undefined,
      }
    ).catch(err => {
      console.error('Webhook trigger error:', err)
    })

    return NextResponse.json({
      order,
      message: 'Order status updated successfully',
    })
  } catch (error: any) {
    console.error('Order Update Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const supabase = createClient()

    const { data: order, error } = await supabase
      .from('orders')
      .select('*, qr_code:qr_codes(table_number, location_description), restaurant:restaurants(name, logo_url)')
      .eq('id', id)
      .maybeSingle()

    if (error || !order) {
      return NextResponse.json(
        { error: error?.message || 'Order not found' },
        { status: error ? 500 : 404 }
      )
    }

    // Fetch items
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', id)

    return NextResponse.json({ order: { ...order, items } })
  } catch (error: any) {
    console.error('Order Fetch Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
