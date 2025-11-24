'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, XCircle, MapPin, ChefHat } from 'lucide-react'
import { getStatusColor } from '@/lib/utils'

import { useApp } from '@/lib/app-context'

interface Order {
  id: string
  order_number: string
  items: any[]
  total_amount: number
  status: string
  customer_name: string | null
  customer_notes: string | null
  qr_code: { table_number: string; location_description: string | null } | null
  created_at: string
}

interface Props {
  initialOrders: Order[]
  restaurantId: string
}

const STATUS_CONFIG_KEYS = {
  pending: { labelKey: 'pending', color: 'bg-yellow-500', icon: Clock },
  preparing: { labelKey: 'preparing', color: 'bg-blue-500', icon: ChefHat },
  ready: { labelKey: 'ready', color: 'bg-green-500', icon: CheckCircle },
  served: { labelKey: 'served', color: 'bg-slate-500', icon: CheckCircle },
  cancelled: { labelKey: 'cancel', color: 'bg-red-500', icon: XCircle }, // Using cancel for label
  paid: { labelKey: 'served', color: 'bg-emerald-600', icon: CheckCircle }, // Fallback/Custom
}

export default function OrdersDashboard({ initialOrders, restaurantId }: Props) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [activeTab, setActiveTab] = useState('all')
  const { t } = useApp()

  // Real-time subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('orders')
              .select(`
                *,
                qr_code:qr_codes(table_number, location_description),
                items:order_items(product_id, product_name, product_price, quantity, notes)
              `)
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setOrders((prev) => [data, ...prev])
              new Audio('/notification.mp3').play().catch(() => { })
            }
          } else if (payload.eventType === 'UPDATE') {
            setOrders((prev) =>
              prev.map((order) =>
                order.id === payload.new.id
                  ? { ...order, ...payload.new }
                  : order
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await (supabase
      .from('orders') as any)
      .update({ status: newStatus })
      .eq('id', orderId)

    if (error) {
      console.error('Error updating order:', error)
      alert(t.common.error)
    } else {
      // Success notification
      const statusMessages: Record<string, string> = {
        'preparing': 'Sipariş hazırlanıyor olarak işaretlendi',
        'ready': 'Sipariş hazır olarak işaretlendi',
        'served': 'Sipariş teslim edildi olarak işaretlendi',
        'cancelled': 'Sipariş iptal edildi'
      }

      if (statusMessages[newStatus]) {
        // Show toast using browser notification
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg z-50'
        notification.textContent = statusMessages[newStatus]
        document.body.appendChild(notification)
        setTimeout(() => notification.remove(), 3000)
      }
    }
  }

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true
    if (activeTab === 'active') return ['pending', 'preparing', 'ready'].includes(order.status)
    return order.status === activeTab
  })

  const activeOrdersCount = orders.filter((o) =>
    ['pending', 'preparing', 'ready'].includes(o.status)
  ).length

  const getStatusLabel = (status: string) => {
    // @ts-ignore
    const key = STATUS_CONFIG_KEYS[status]?.labelKey
    // @ts-ignore
    return key && t.orders.actions[key] ? t.orders.actions[key] : (t.orders[status] || status)
  }

  const getStatusConfig = (status: string) => {
    // @ts-ignore
    const config = STATUS_CONFIG_KEYS[status] || STATUS_CONFIG_KEYS.pending
    return { ...config, label: getStatusLabel(status) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Badge className="text-lg px-4 py-2">
          {activeOrdersCount} {t.orders.activeOrders}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="dark:bg-gray-800">
          <TabsTrigger value="all" className="dark:text-slate-200 dark:data-[state=active]:bg-gray-700">{t.orders.all} ({orders.length})</TabsTrigger>
          <TabsTrigger value="active" className="dark:text-slate-200 dark:data-[state=active]:bg-gray-700">{t.orders.active} ({activeOrdersCount})</TabsTrigger>
          <TabsTrigger value="pending" className="dark:text-slate-200 dark:data-[state=active]:bg-gray-700">{t.orders.pending}</TabsTrigger>
          <TabsTrigger value="preparing" className="dark:text-slate-200 dark:data-[state=active]:bg-gray-700">{t.orders.preparing}</TabsTrigger>
          <TabsTrigger value="ready" className="dark:text-slate-200 dark:data-[state=active]:bg-gray-700">{t.orders.ready}</TabsTrigger>
          <TabsTrigger value="served" className="dark:text-slate-200 dark:data-[state=active]:bg-gray-700">{t.orders.served}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredOrders.length === 0 ? (
            <Card className="dark:bg-gray-800 dark:border-gray-700">
              <CardContent className="text-center py-12">
                <p className="text-slate-500 dark:text-slate-400">Sipariş bulunamadı.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => {
                const statusConfig = getStatusConfig(order.status)
                const StatusIcon = statusConfig.icon

                return (
                  <Card key={order.id} className={`relative dark:bg-gray-800 dark:border-gray-700 border-l-4 ${getStatusColor(order.status)} transition-colors`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 dark:text-white">
                            <span>#{order.order_number}</span>
                            {order.customer_name && (
                              <span className="text-base font-normal text-muted-foreground">
                                - {order.customer_name}
                              </span>
                            )}
                          </CardTitle>
                          {order.qr_code?.table_number && (
                            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {t.orders.table} {order.qr_code.table_number}
                            </p>
                          )}
                        </div>
                        <Badge
                          className={`${statusConfig.color} text-white flex items-center gap-1`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {/* Use translated status */}
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                        {formatDistanceToNow(new Date(order.created_at), {
                          addSuffix: true,
                          locale: tr,
                        })}
                      </p>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Items */}
                      {order.items && order.items.length > 0 ? (
                        <div className="space-y-2">
                          {order.items.map((item: any, idx: number) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm dark:text-slate-300"
                            >
                              <span>
                                {item.quantity}x {item.product_name || item.name}
                              </span>
                              <span className="font-semibold dark:text-slate-200">
                                ₺{(item.product_price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 italic dark:text-slate-500">
                          Ürün detayları yok.
                        </div>
                      )}

                      {order.customer_notes && (
                        <div className="p-2 bg-slate-50 dark:bg-gray-700 rounded text-sm dark:text-slate-300">
                          <strong>{t.orders.notes}:</strong> {order.customer_notes}
                        </div>
                      )}

                      <div className="border-t pt-3 dark:border-gray-700">
                        <div className="flex items-center justify-between font-bold">
                          <span className="dark:text-white">{t.orders.total}</span>
                          <span className="text-lg text-green-600 dark:text-green-400">
                            ₺{order.total_amount.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Status Actions */}
                      <div className="flex gap-2">
                        {order.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="flex-1"
                            >
                              {t.orders.actions.prepare}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            >
                              {t.orders.actions.cancel}
                            </Button>
                          </>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'ready')}
                            className="w-full"
                          >
                            {t.orders.actions.ready}
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(order.id, 'served')}
                            className="w-full"
                          >
                            {t.orders.actions.serve}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
