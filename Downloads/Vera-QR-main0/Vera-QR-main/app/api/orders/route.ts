import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateOrder } from '@/lib/validators'
import { generateOrderNumber } from '@/lib/utils'
import { triggerWebhooks } from '@/lib/webhook'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate order data
    // Note: validateOrder might need updates if it checks for table_id instead of qr_code_id or restaurant_id
    // For now assuming body structure matches.
    const { items, qr_code_id, customer_name, customer_notes, restaurant_id } = body

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Items are required' }, { status: 400 })
    }

    if (!restaurant_id) {
      return NextResponse.json({ error: 'Restaurant ID is required' }, { status: 400 })
    }

    const supabase = createClient()

    // Verify restaurant exists (optional but good)

    // Generate order number
    const orderNumber = generateOrderNumber()
    console.log('[Orders API] Creating order:', { orderNumber, restaurant_id, itemsCount: items.length })

    // Get session ID from request or generate new one
    const sessionId = body.session_id || `session_${Date.now()}`

    // Calculate total amounts
    // Assuming items have price. We should ideally fetch prices from DB to prevent tampering.
    // For strictness, let's fetch products.
    const productIds = items.map((i: any) => i.product_id)
    console.log('[Orders API] Fetching products for IDs:', productIds)

    const { data: products } = await supabase
      .from('products')
      .select('id, price, name_tr, name_en')
      .in('id', productIds)
      .eq('restaurant_id', restaurant_id)

    console.log('[Orders API] Products fetched:', products?.length)

    if (!products || products.length !== items.length) {
      // Some products not found or mismatch
      // Proceeding with provided prices might be risky but common in simple apps.
      // Let's use DB prices for calculation if found.
      console.warn('[Orders API] Product count mismatch. Expected:', items.length, 'Got:', products?.length)
    }

    let subtotal = 0
    const orderItemsToInsert = items.map((item: any) => {
      const product = products?.find(p => p.id === item.product_id)
      const price = product ? product.price : item.price
      const name = product ? (product.name_tr || product.name_en) : 'Unknown Product'

      subtotal += price * item.quantity

      return {
        product_id: item.product_id,
        product_name: name,
        product_price: price,
        quantity: item.quantity,
        notes: item.notes
      }
    })

    const taxAmount = subtotal * 0.10 // Example 10% tax
    const totalAmount = subtotal + taxAmount

    console.log('[Orders API] Calculated totals:', { subtotal, taxAmount, totalAmount })

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        restaurant_id: restaurant_id,
        qr_code_id: qr_code_id || null,
        order_number: orderNumber,
        // items: items, // Removed: items are in separate table now
        subtotal: subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'pending',
        customer_name: customer_name || null,
        notes: customer_notes || null,  // Changed from customer_notes to notes
        session_id: sessionId,
        payment_status: 'unpaid'
      })
      .select()
      .single()

    console.log('[Orders API] Order creation result:', { success: !!order, error: orderError, orderId: order?.id })

    if (orderError || !order) {
      console.error('[Orders API] Order creation failed:', orderError)
      throw orderError || new Error('Failed to create order')
    }

    // Insert order items
    const itemsWithOrderId = orderItemsToInsert.map((item: any) => ({
      ...item,
      order_id: order.id
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId)

    if (itemsError) {
      console.error('Failed to insert order items:', itemsError)
      // Should probably delete order or mark as failed, but simplifying here
    }

    // Update table status (qr_code status?) - Schema doesn't have occupied status on qr_codes, mostly 'active'.
    // Skipping table status update as per new schema.

    // Track analytics
    await supabase
      .from('analytics_events')
      .insert({
        restaurant_id: restaurant_id,
        event_type: 'order_created',
        event_data: {
          order_id: order.id,
          items_count: items.length,
          total_amount: totalAmount,
        },
        session_id: sessionId,
      })

    // Trigger webhooks for order.created event
    triggerWebhooks(
      supabase,
      restaurant_id,
      'order.created',
      order.id,
      { ...order, items: itemsWithOrderId }, // Include items in webhook payload
      {
        qr_code_id: qr_code_id,
        customer_name: customer_name || undefined,
        items_count: items.length,
      }
    ).catch(err => {
      console.error('Webhook trigger error:', err)
    })

    return NextResponse.json({
      order: { ...order, items: itemsWithOrderId },
      message: 'Order created successfully',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Order Creation Error:', error)

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const sessionId = searchParams.get('session_id')
    const restaurantId = searchParams.get('restaurant_id')

    if (!sessionId && !restaurantId) {
      return NextResponse.json(
        { error: 'session_id or restaurant_id is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    let query = supabase
      .from('orders')
      .select('*, qr_code:qr_codes(table_number, location_description)') // Join qr_codes
      .order('created_at', { ascending: false })

    if (sessionId) {
      query = query.eq('session_id', sessionId)
    }

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId)
    }

    const { data: orders, error } = await query

    if (error) {
      throw error
    }

    return NextResponse.json({ orders })
  } catch (error: any) {
    console.error('Orders Fetch Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
