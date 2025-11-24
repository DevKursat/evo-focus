import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import LoyaltyManagement from '@/components/restaurant/loyalty-management'
import PageHeader from '@/components/restaurant/page-header'

export default async function LoyaltyPage() {
  const adminInfo = await getRestaurantAdminInfo()
  
  if (!adminInfo) {
    redirect('/auth/login')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.loyalty.title"
        descriptionKey="pages.loyalty.description"
      />

      <LoyaltyManagement restaurantId={adminInfo.restaurant_id} />
    </div>
  )
}
