import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    try {
        const supabase = createClient()
        const body = await request.json()
        const { organization_id, table_id, call_type, qr_code_id } = body

        if (!organization_id || !qr_code_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get QR code info for table number
        const { data: qrCode } = await supabase
            .from('qr_codes')
            .select('table_number')
            .eq('id', qr_code_id)
            .single()

        // Create waiter call request
        const { data, error } = await supabase
            .from('waiter_calls')
            .insert({
                restaurant_id: organization_id,
                qr_code_id: qr_code_id,
                table_number: qrCode?.table_number || 'Unknown',
                call_type: call_type || 'service',
                status: 'pending',
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating waiter call:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error('Waiter call error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = createClient()
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
