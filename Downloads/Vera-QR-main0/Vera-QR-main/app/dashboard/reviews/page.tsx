import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import ReviewsManagement from '@/components/restaurant/reviews-management'
import PageHeader from '@/components/restaurant/page-header'

export default async function ReviewsPage() {
  const adminInfo = await getRestaurantAdminInfo()
  
  if (!adminInfo) {
    redirect('/auth/login')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titleKey="pages.reviews.title"
        descriptionKey="pages.reviews.description"
      />

      <ReviewsManagement restaurantId={adminInfo.restaurant_id} />
    </div>
  )
}
