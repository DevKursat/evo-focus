import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import CustomersList from '@/components/restaurant/customers-list'
import PageHeader from '@/components/restaurant/page-header'

export default async function CustomersPage() {
  const adminInfo = await getRestaurantAdminInfo()

  if (!adminInfo) {
    redirect('/auth/login')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.customers.title"
        descriptionKey="pages.customers.description"
      />

      <CustomersList restaurantId={adminInfo.restaurant_id} />
    </div>
  )
}
