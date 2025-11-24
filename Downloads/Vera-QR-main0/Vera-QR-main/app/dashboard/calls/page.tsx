import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import TableCallsManagement from '@/components/restaurant/table-calls-management'
import PageHeader from '@/components/restaurant/page-header'

export const dynamic = 'force-dynamic'

export default async function CallsPage() {
  const supabase = createClient()
  const adminInfo = await getRestaurantAdminInfo()

  const { data: calls } = await supabase
    .from('table_calls')
    .select('*')
    .eq('restaurant_id', adminInfo?.restaurant_id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.calls.title"
        descriptionKey="pages.calls.description"
      />

      <TableCallsManagement
        initialCalls={calls || []}
        restaurantId={adminInfo!.restaurant_id}
      />
    </div>
  )
}
