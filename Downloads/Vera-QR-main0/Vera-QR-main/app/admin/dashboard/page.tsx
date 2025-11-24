import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Store, Users, ShoppingCart, TrendingUp } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = createClient()

  let restaurantsCount = 0
  let usersCount = 0
  let ordersCount = 0

  try {
    // Fetch statistics
    const [
      { count: rCount },
      { count: uCount },
      { count: oCount },
    ] = await Promise.all([
      (supabase.from('restaurants').select('*', { count: 'exact', head: true })),
      (supabase.from('profiles').select('*', { count: 'exact', head: true })),
      (supabase.from('orders').select('*', { count: 'exact', head: true })),
    ])

    restaurantsCount = rCount || 0
    usersCount = uCount || 0
    ordersCount = oCount || 0
  } catch (error) {
    console.error('Error fetching admin dashboard stats:', error)
    // Fallback for development without DB
    restaurantsCount = 5
    usersCount = 120
    ordersCount = 450
  }

  const stats = [
    {
      title: 'Toplam İşletme',
      value: restaurantsCount,
      icon: Store,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Toplam Kullanıcı',
      value: usersCount,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Toplam Sipariş',
      value: ordersCount,
      icon: ShoppingCart,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Büyüme',
      value: '+12%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-slate-600 mt-1">VERA QR Platform Yönetimi</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-slate-500">
              Henüz aktivite bulunmuyor.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
