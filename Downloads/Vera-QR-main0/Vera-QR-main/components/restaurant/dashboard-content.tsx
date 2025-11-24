'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, DollarSign, Users, TrendingUp, UtensilsCrossed } from 'lucide-react'
import Link from 'next/link'
import { useApp } from '@/lib/app-context'
import RecentActivity from './recent-activity'

interface Props {
  todayOrders: number
  todayRevenue: number
  pendingOrders: number
  restaurantName: string
  restaurantId?: string
}

export default function DashboardContent({
  todayOrders,
  todayRevenue,
  pendingOrders,
  restaurantName,
  restaurantId
}: Props) {
  const { t } = useApp()

  const stats = [
    {
      title: t.dashboard.todayOrders,
      value: todayOrders,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: t.dashboard.todayRevenue,
      value: `₺${todayRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: t.dashboard.pendingOrders,
      value: pendingOrders,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: t.dashboard.avgOrder,
      value: todayOrders > 0 ? `₺${(todayRevenue / todayOrders).toFixed(2)}` : '₺0',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">{t.dashboard.title}</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          {restaurantName} - {t.dashboard.statistics}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {stat.title}
              </CardTitle>
              <div className={`${stat.bgColor} dark:bg-gray-700 p-2 rounded-lg`}>
                <stat.icon className={`h-5 w-5 ${stat.color} dark:text-white`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold dark:text-white">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Quick Actions - Spans 4 columns */}
        <div className="md:col-span-4 space-y-6">
             <Card className="dark:bg-gray-800 dark:border-gray-700">
                <CardHeader>
                <CardTitle className="dark:text-white">{t.dashboard.quickActions}</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-2 gap-4">
                    <Link
                    href="/dashboard/menu"
                    className="p-4 rounded-lg border-2 border-slate-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-center"
                    >
                    <UtensilsCrossed className="h-8 w-8 mx-auto mb-2 text-slate-600 dark:text-slate-300" />
                    <div className="text-sm font-medium dark:text-slate-200">{t.dashboard.editMenu}</div>
                    </Link>
                    <Link
                    href="/dashboard/orders"
                    className="p-4 rounded-lg border-2 border-slate-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-center"
                    >
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-slate-600 dark:text-slate-300" />
                    <div className="text-sm font-medium dark:text-slate-200">{t.dashboard.orders}</div>
                    </Link>
                    <Link
                    href="/dashboard/tables"
                    className="p-4 rounded-lg border-2 border-slate-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-center"
                    >
                    <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-slate-600 dark:text-slate-300" />
                    <div className="text-sm font-medium dark:text-slate-200">{t.dashboard.qrCodes}</div>
                    </Link>
                    <Link
                    href="/dashboard/analytics"
                    className="p-4 rounded-lg border-2 border-slate-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-center"
                    >
                    <TrendingUp className="h-8 w-8 mx-auto mb-2 text-slate-600 dark:text-slate-300" />
                    <div className="text-sm font-medium dark:text-slate-200">{t.dashboard.analytics}</div>
                    </Link>
                </div>
                </CardContent>
            </Card>
        </div>

        {/* Recent Activity - Spans 3 columns */}
        <div className="md:col-span-3">
            {restaurantId ? <RecentActivity restaurantId={restaurantId} /> : null}
        </div>
      </div>
    </div>
  )
}
