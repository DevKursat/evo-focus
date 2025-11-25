import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ReviewsDashboard from '@/components/restaurant/reviews-dashboard'

export default async function ReviewsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user's organization
  const { data: member } = await supabase
    .from('restaurant_admins')
    .select('restaurant_id')
    .eq('profile_id', user.id)
    .single()


  if (!member) {
    return <div className="p-8">Organizasyon bulunamadı.</div>
  }

  return (
    <div className="container py-8">
      <ReviewsDashboard restaurantId={member.restaurant_id} />
    </div>
  )
}
