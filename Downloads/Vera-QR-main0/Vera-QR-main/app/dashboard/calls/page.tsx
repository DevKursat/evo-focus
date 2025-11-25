import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import WaiterCallsDashboard from '@/components/restaurant/waiter-calls-dashboard'
import PageHeader from '@/components/restaurant/page-header'

export const dynamic = 'force-dynamic'

export default async function CallsPage() {
  const adminInfo = await getRestaurantAdminInfo()

  if (!adminInfo) {
    return <div>Yetkiniz yok</div>
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.calls.title"
        descriptionKey="pages.calls.description"
      />

      <WaiterCallsDashboard restaurantId={adminInfo.restaurant_id} />
    </div>
  )
}
