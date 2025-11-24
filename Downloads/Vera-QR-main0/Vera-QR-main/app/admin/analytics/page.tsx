import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, Users, ShoppingBag, Utensils } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { tr } from 'date-fns/locale'
import AdminAnalyticsContent from '@/components/admin/analytics/analytics-content'

export const dynamic = 'force-dynamic'

export default async function AdminAnalyticsPage() {
  const supabase = createClient()

  let restaurantCount = 0
  let userCount = 0
  let orderCount = 0
  let totalRevenue = 0
  let last30Days: { date: string; fullDate: string; total: number }[] = []
  let statusData: { name: string; value: number }[] = []

  try {
    // 1. Fetch Counts
    const { count: rCount } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true })
    restaurantCount = rCount || 0

    const { count: uCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    userCount = uCount || 0

    const { count: oCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    orderCount = oCount || 0

    // 2. Fetch Total Revenue (Paid orders)
    const { data: paidOrders } = await supabase
      .from('orders')
      .select('total_amount, created_at')
      .eq('payment_status', 'paid')

    totalRevenue = paidOrders?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0

    // 3. Prepare Chart Data (Last 30 days revenue)
    last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(new Date(), 29 - i)
      return {
        date: format(d, 'd MMM', { locale: tr }),
        fullDate: format(d, 'yyyy-MM-dd'),
        total: 0
      }
    })

    paidOrders?.forEach(order => {
      const orderDate = format(new Date(order.created_at), 'yyyy-MM-dd')
      const day = last30Days.find(d => d.fullDate === orderDate)
      if (day) {
        day.total += Number(order.total_amount)
      }
    })

    // 4. Fetch Order Status Distribution
    const { data: ordersStatus } = await supabase
      .from('orders')
      .select('status')

    const statusCounts: Record<string, number> = {}
    ordersStatus?.forEach(o => {
      const s = o.status || 'unknown'
      statusCounts[s] = (statusCounts[s] || 0) + 1
    })

    statusData = Object.entries(statusCounts).map(([name, value]) => {
      let label = name
      switch (name) {
        case 'pending': label = 'Beklemede'; break;
        case 'preparing': label = 'Hazırlanıyor'; break;
        case 'ready': label = 'Hazır'; break;
        case 'served': label = 'Servis Edildi'; break;
        case 'cancelled': label = 'İptal'; break;
        case 'paid': label = 'Ödendi'; break;
        case 'completed': label = 'Tamamlandı'; break;
      }
      return {
        name: label,
        value
      }
    })
  } catch (e) {
    console.error('Analytics fetch error:', e)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analitik</h1>
        <p className="text-slate-600 mt-1">
          Platform genelindeki detaylı istatistikler ve raporlar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Gelir
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{totalRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
            <p className="text-xs text-muted-foreground">
              Toplam ödenmiş sipariş tutarı
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Toplam Sipariş
            </CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Platform üzerindeki tüm siparişler
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aktif İşletmeler
            </CardTitle>
            <Utensils className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{restaurantCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Kayıtlı restoran sayısı
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Kullanıcılar
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Toplam kayıtlı kullanıcı
            </p>
          </CardContent>
        </Card>
      </div>

      <AdminAnalyticsContent revenueData={last30Days} statusData={statusData} />
    </div>
  )
}
