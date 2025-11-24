'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, DollarSign, ShoppingCart, Clock, Award } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface AnalyticsData {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  topItems: Array<{ name: string; count: number; revenue: number }>
  hourlyData: Array<{ hour: string; orders: number }>
  dailyRevenue: Array<{ date: string; revenue: number }>
  categoryDistribution: Array<{ name: string; value: number }>
}

interface Props {
  restaurantId: string
  dateRange?: { from: Date; to: Date }
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']

export default function AnalyticsDashboard({ restaurantId, dateRange }: Props) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  const fetchAnalytics = useCallback(async () => {
    try {
      // Get date range
      const from = dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const to = dateRange?.to || new Date()

      // Fetch orders with items
      // Note: using restaurant_id instead of organization_id
      const { data: orders, error: ordersError } = await (supabase
        .from('orders')
        .select(`
          id,
          total_amount,
          status,
          created_at,
          order_items (
            product_id,
            quantity,
            product_price,
            products (
              name_tr,
              category:categories(name_tr)
            )
          )
        `)
        .eq('restaurant_id', restaurantId)
        .gte('created_at', from.toISOString())
        .lte('created_at', to.toISOString())
        .in('status', ['preparing', 'ready', 'served']) as any)

      if (ordersError) throw ordersError

      // Process data
      const totalOrders = orders?.length || 0
      const totalRevenue = orders?.reduce((sum: number, o: any) => sum + (o.total_amount || 0), 0) || 0
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Top items
      const itemsMap = new Map<string, { count: number; revenue: number }>()
      orders?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          const name = item.products?.name_tr || 'Bilinmeyen'
          const existing = itemsMap.get(name) || { count: 0, revenue: 0 }
          // Use product_price if available, or fallback (schema has product_price in order_items)
          const price = item.product_price || 0
          itemsMap.set(name, {
            count: existing.count + item.quantity,
            revenue: existing.revenue + price * item.quantity,
          })
        })
      })

      const topItems = Array.from(itemsMap.entries())
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      // Hourly distribution
      const hourlyMap = new Map<number, number>()
      for (let i = 0; i < 24; i++) hourlyMap.set(i, 0)

      orders?.forEach((order: any) => {
        const hour = new Date(order.created_at).getHours()
        hourlyMap.set(hour, (hourlyMap.get(hour) || 0) + 1)
      })

      const hourlyData = Array.from(hourlyMap.entries())
        .map(([hour, orders]) => ({
          hour: `${hour.toString().padStart(2, '0')}:00`,
          orders,
        }))
        .filter((d) => d.orders > 0)

      // Daily revenue (last 7 days)
      const dailyMap = new Map<string, number>()
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - i)
        return date.toISOString().split('T')[0]
      }).reverse()

      last7Days.forEach((date) => dailyMap.set(date, 0))

      orders?.forEach((order: any) => {
        const date = order.created_at.split('T')[0]
        if (dailyMap.has(date)) {
          dailyMap.set(date, (dailyMap.get(date) || 0) + (order.total_amount || 0))
        }
      })

      const dailyRevenue = Array.from(dailyMap.entries()).map(([date, revenue]) => ({
        date: new Date(date).toLocaleDateString('tr-TR', {
          month: 'short',
          day: 'numeric',
        }),
        revenue,
      }))

      // Category distribution
      const categoryMap = new Map<string, number>()
      orders?.forEach((order: any) => {
        order.order_items?.forEach((item: any) => {
          const categoryName = item.products?.category?.name_tr || 'Diğer'
          categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + item.quantity)
        })
      })

      const categoryDistribution = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

      setData({
        totalRevenue,
        totalOrders,
        avgOrderValue,
        topItems,
        hourlyData,
        dailyRevenue,
        categoryDistribution,
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      toast({
        title: 'Hata',
        description: 'Analiz verileri yüklenemedi',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId, dateRange, toast])

  useEffect(() => {
    fetchAnalytics()
  }, [restaurantId, dateRange, fetchAnalytics])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Analiz verileri yükleniyor...</p>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Toplam Gelir
            </CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(data.totalRevenue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Son 30 gün</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Toplam Sipariş
            </CardDescription>
            <CardTitle className="text-3xl">{data.totalOrders}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Tamamlanan siparişler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Ortalama Sepet
            </CardDescription>
            <CardTitle className="text-3xl">
              {formatCurrency(data.avgOrderValue)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">Sipariş başına</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Yoğun Saat
            </CardDescription>
            <CardTitle className="text-3xl">
              {data.hourlyData.length > 0
                ? data.hourlyData.reduce((max, curr) =>
                    curr.orders > max.orders ? curr : max
                  ).hour
                : '-'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">En çok sipariş</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Daily Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Günlük Gelir Trendi</CardTitle>
            <CardDescription>Son 7 günün gelir grafiği</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ fill: '#3B82F6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Saatlik Sipariş Dağılımı</CardTitle>
            <CardDescription>Hangi saatlerde yoğunsunuz?</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.hourlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip labelStyle={{ color: '#000' }} />
                <Bar dataKey="orders" fill="#10B981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Items */}
        <Card>
          <CardHeader>
            <CardTitle>En Çok Satan Ürünler</CardTitle>
            <CardDescription>Satış adedine göre top 10</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.topItems.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.count} adet
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{formatCurrency(item.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Kategori Dağılımı</CardTitle>
            <CardDescription>Sipariş adedine göre</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.categoryDistribution.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Önemli İçgörüler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
              <p className="font-semibold text-blue-900 mb-1">En Popüler Ürün</p>
              <p className="text-sm text-blue-700">
                {data.topItems[0]?.name || '-'} ({data.topItems[0]?.count || 0} adet)
              </p>
            </div>

            <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded">
              <p className="font-semibold text-green-900 mb-1">En Karlı Ürün</p>
              <p className="text-sm text-green-700">
                {data.topItems.sort((a, b) => b.revenue - a.revenue)[0]?.name || '-'}
                {' '}({formatCurrency(data.topItems[0]?.revenue || 0)})
              </p>
            </div>

            <div className="p-4 bg-purple-50 border-l-4 border-purple-500 rounded">
              <p className="font-semibold text-purple-900 mb-1">En Popüler Kategori</p>
              <p className="text-sm text-purple-700">
                {data.categoryDistribution[0]?.name || '-'} (
                {data.categoryDistribution[0]?.value || 0} sipariş)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
