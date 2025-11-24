import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WaiterCallsDashboard from '@/components/restaurant/waiter-calls-dashboard'

export default async function WaiterCallsPage() {
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        redirect('/auth/login')
    }

    const { data: adminData } = await supabase
        .from('restaurant_admins')
        .select('restaurant_id')
        .eq('profile_id', user.id)
        .single()

    if (!adminData) {
        redirect('/dashboard')
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Garson Çağrıları</h1>
            <WaiterCallsDashboard restaurantId={adminData.restaurant_id} />
        </div>
    )
}
