import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import CouponManagement from '@/components/restaurant/coupon-management'
import PageHeader from '@/components/restaurant/page-header'

export default async function CouponsPage() {
  const adminInfo = await getRestaurantAdminInfo()
  
  if (!adminInfo) {
    redirect('/auth/login')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.coupons.title"
        descriptionKey="pages.coupons.description"
      />

      <CouponManagement restaurantId={adminInfo.restaurant_id} />
    </div>
  )
}
