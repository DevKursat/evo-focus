import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import RestaurantsList from '@/components/admin/restaurants-list'

export default async function RestaurantsPage() {
  const supabase = createClient()
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching restaurants:', error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">İşletmeler</h1>
          <p className="text-slate-600 mt-1">
            Platformdaki tüm restoranları ve işletmeleri yönetin
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/restaurants/new">
            <Plus className="mr-2 h-4 w-4" />
            Yeni İşletme Ekle
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tüm İşletmeler ({restaurants?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <RestaurantsList restaurants={restaurants || []} />
        </CardContent>
      </Card>
    </div>
  )
}
