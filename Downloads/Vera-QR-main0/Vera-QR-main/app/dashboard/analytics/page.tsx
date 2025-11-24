import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import AnalyticsDashboard from '@/components/restaurant/analytics-dashboard'

export default async function AnalyticsPage() {
  const adminInfo = await getRestaurantAdminInfo()
  
  if (!adminInfo) {
    redirect('/auth/login')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Satış Analizi</h1>
        <p className="text-muted-foreground mt-2">
          Detaylı satış raporları ve performans metrikleri
        </p>
      </div>

      <AnalyticsDashboard restaurantId={adminInfo.restaurant_id} />
    </div>
  )
}
