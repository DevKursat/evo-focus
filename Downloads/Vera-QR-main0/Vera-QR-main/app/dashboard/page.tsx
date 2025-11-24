import { createClient } from '@/lib/supabase/server'
import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import DashboardContent from '@/components/restaurant/dashboard-content'

export default async function RestaurantDashboard() {
  const supabase = createClient()

  let todayOrders = 0
  let todayRevenueValue = 0
  let pendingOrders = 0
  let restaurantName = 'Restoran'

  try {
    const adminInfo = await getRestaurantAdminInfo()
    restaurantName = (adminInfo as any)?.restaurant?.name || 'Restoran'

    // Fetch today's statistics
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (adminInfo?.restaurant_id) {
      const [
        { count: tOrders },
        { data: tRevenue },
        { count: pOrders },
      ] = await Promise.all([
        (supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', adminInfo.restaurant_id)
          .gte('created_at', today.toISOString())),
        (supabase
          .from('orders')
          .select('total_amount')
          .eq('restaurant_id', adminInfo.restaurant_id)
          .gte('created_at', today.toISOString())),
        (supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })
          .eq('restaurant_id', adminInfo.restaurant_id)
          .in('status', ['pending', 'preparing'])),
      ])

      todayOrders = tOrders || 0
      todayRevenueValue = tRevenue?.reduce((sum: number, order: any) => sum + Number(order.total_amount), 0) || 0
      pendingOrders = pOrders || 0
    }

  } catch (error) {
    console.error('Error fetching restaurant dashboard stats:', error)
    // Fallback to zero on error to avoid misleading data
    todayOrders = 0
    todayRevenueValue = 0
    pendingOrders = 0
    // Keep restaurantName from adminInfo if we got it before the error
  }

  return (
    <DashboardContent
      todayOrders={todayOrders}
      todayRevenue={todayRevenueValue}
      pendingOrders={pendingOrders}
      restaurantName={restaurantName}
    />
  )
}
