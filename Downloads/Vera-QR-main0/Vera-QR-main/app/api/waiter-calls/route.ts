import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Initialize admin client for bypassing RLS
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { organization_id, table_id, call_type, qr_code_id, customer_name } = body

        if (!organization_id) {
            return NextResponse.json({ error: 'Missing required field: organization_id' }, { status: 400 })
        }

        let tableNumber = 'QR Okutulmamış'

        // Get QR code info if provided
        if (qr_code_id) {
            const { data: qrCode, error: qrError } = await supabaseAdmin
                .from('qr_codes')
                .select('table_number')
                .eq('id', qr_code_id)
                .single()

            if (!qrError && qrCode) {
                tableNumber = qrCode.table_number
            } else {
                console.warn('QR Code provided but not found:', qr_code_id)
                // Continue without failing, just log warning
            }
        }

        // Create waiter call request
        console.log('Creating waiter call with data:', {
            restaurant_id: organization_id,
            qr_code_id: qr_code_id || null,
            table_number: tableNumber,
            customer_name: customer_name || 'Misafir',
            call_type: call_type || 'service',
            status: 'pending',
        })

        const { data, error } = await supabaseAdmin
            .from('waiter_calls')
            .insert({
                restaurant_id: organization_id,
                qr_code_id: qr_code_id || null,
                table_number: tableNumber,
                customer_name: customer_name || 'Misafir',
                call_type: call_type || 'service',
                status: 'pending',
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating waiter call:', error)
            console.error('Error details:', JSON.stringify(error, null, 2))
            return NextResponse.json({ error: error.message || 'Database insert failed', details: error }, { status: 500 })
        }

        console.log('Waiter call created successfully:', data)
        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Waiter call error:', error)
        console.error('Error stack:', error.stack)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = supabaseAdmin
        const body = await request.json()
        const { id, status } = body

        if (!id || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const updateData: any = { status }

        if (status === 'acknowledged') {
            updateData.acknowledged_at = new Date().toISOString()
        } else if (status === 'completed') {
            updateData.completed_at = new Date().toISOString()
        }

        const { data, error } = await supabase
            .from('waiter_calls')
            .update(updateData)
            .eq('id', id)
            .select()
            .single()

        if (error) {
            console.error('Error updating waiter call:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Waiter call update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
