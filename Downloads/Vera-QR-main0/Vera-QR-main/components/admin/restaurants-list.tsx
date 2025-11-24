'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, ExternalLink, QrCode, LayoutDashboard } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { setAdminViewRestaurant } from '@/app/actions/admin'

interface Restaurant {
  id: string
  name: string
  slug: string
  logo_url: string | null
  status: string
  subscription_tier: string
  created_at: string
}

interface Props {
  restaurants: Restaurant[]
}

export default function RestaurantsList({ restaurants }: Props) {
  if (restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Henüz işletme eklenmemiş.</p>
      </div>
    )
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      active: 'default',
      suspended: 'destructive',
      pending: 'secondary',
    }
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {status === 'active' ? 'Aktif' : status === 'suspended' ? 'Askıya Alındı' : 'Beklemede'}
      </Badge>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>İşletme</TableHead>
            <TableHead>Slug</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Oluşturulma</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {restaurants.map((restaurant) => (
            <TableRow key={restaurant.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  {restaurant.logo_url ? (
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden">
                      <Image
                        src={restaurant.logo_url}
                        alt={restaurant.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-slate-200 flex items-center justify-center">
                      <span className="text-lg font-bold text-slate-600">
                        {restaurant.name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{restaurant.name}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <code className="text-sm bg-slate-100 dark:bg-slate-700 dark:text-white px-2 py-1 rounded">
                  /{restaurant.slug}
                </code>
              </TableCell>
              <TableCell>{getStatusBadge(restaurant.status)}</TableCell>
              <TableCell className="capitalize">{restaurant.subscription_tier}</TableCell>
              <TableCell className="text-sm text-slate-600">
                {formatDistanceToNow(new Date(restaurant.created_at), {
                  addSuffix: true,
                  locale: tr,
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/${restaurant.slug}`} target="_blank">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/restaurants/${restaurant.id}/qr`}>
                    <Button variant="ghost" size="sm">
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/admin/restaurants/${restaurant.id}/edit`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>

                  <form action={async () => {
                    await setAdminViewRestaurant(restaurant.id)
                  }}>
                    <Button variant="ghost" size="sm" title="Yönetim Paneline Git">
                      <LayoutDashboard className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
