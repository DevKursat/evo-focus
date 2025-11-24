'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, CheckCircle, Bell, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function RecentActivity({ restaurantId }: { restaurantId: string }) {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivity = async () => {
      // Fetch recent orders
      const { data: orders } = await supabase
        .from('orders')
        .select('id, created_at, total_amount, status, table_number:qr_codes(table_number)')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch recent calls
      const { data: calls } = await supabase
        .from('table_calls')
        .select('id, created_at, table_number, call_type, status')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(5)

      // Merge and sort
      const combined = [
        ...(orders || []).map(o => ({ ...o, type: 'order' })),
        ...(calls || []).map(c => ({ ...c, type: 'call' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 8)

      setActivities(combined)
      setLoading(false)
    }

    fetchActivity()

    // Realtime Subscription
    const channel = supabase
      .channel('dashboard-activity')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${restaurantId}` },
        () => fetchActivity()
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'table_calls', filter: `restaurant_id=eq.${restaurantId}` },
        () => fetchActivity()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId])

  if (loading) {
    return (
        <Card className="dark:bg-gray-800 dark:border-gray-700 h-full">
            <CardHeader>
                <CardTitle>Son Aktiviteler</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                     {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
                             <div className="space-y-2 flex-1">
                                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                                <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
                             </div>
                        </div>
                     ))}
                </div>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="dark:bg-gray-800 dark:border-gray-700 h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="dark:text-white">Son Aktiviteler</CardTitle>
        <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/orders">Tümü</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="text-center text-slate-500 py-8">Henüz aktivite yok.</div>
          ) : (
            activities.map((item) => (
              <div key={item.id} className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0 border-slate-100 dark:border-slate-700">
                <div className={`p-2 rounded-full ${
                    item.type === 'order'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'
                }`}>
                    {item.type === 'order' ? <CheckCircle className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between">
                        <p className="font-medium text-sm dark:text-slate-200">
                            {item.type === 'order'
                                ? `${item.table_number?.table_number || 'Masa ?'} - Yeni Sipariş`
                                : `${item.table_number} - Garson Çağırıyor`
                            }
                        </p>
                        <span className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: tr })}
                        </span>
                    </div>
                    <div className="mt-1 flex justify-between items-center">
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            {item.type === 'order'
                                ? `Tutar: ₺${Number(item.total_amount).toFixed(2)}`
                                : `Talep: ${item.call_type === 'bill' ? 'Hesap' : 'Garson'}`
                            }
                        </p>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                            {item.status === 'pending' ? 'Bekliyor' : item.status}
                        </Badge>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
