import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function PATCH(request: Request) {
    try {
        const supabase = createClient()

        // Get authenticated user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get restaurant ID for this admin
        const { data: adminData } = await supabase
            .from('restaurant_admins')
            .select('restaurant_id')
            .eq('profile_id', user.id)
            .single()

        if (!adminData) {
            return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
        }

        const restaurantId = adminData.restaurant_id
        const updates = await request.json()

        console.log('API: Updating restaurant', restaurantId, updates)

        // Create service role client to bypass RLS
        const serviceSupabase = createServiceClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Update restaurant using service role (bypasses RLS)
        const { data, error } = await serviceSupabase
            .from('restaurants')
            .update(updates)
            .eq('id', restaurantId)
            .select()

        console.log('API: Update result', { data, error })

        if (error) {
            console.error('Error updating restaurant:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data: data?.[0] || data })
    } catch (error: any) {
        console.error('Settings update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
