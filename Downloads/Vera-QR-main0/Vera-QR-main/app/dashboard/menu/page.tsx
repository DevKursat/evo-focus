import { createClient } from '@/lib/supabase/server'
import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import MenuCategoriesList from '@/components/restaurant/menu-categories-list'

export default async function MenuPage() {
  const supabase = createClient()
  const adminInfo = await getRestaurantAdminInfo()

  const [
    { data: categories },
    { data: items },
  ] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('restaurant_id', adminInfo?.restaurant_id)
      .order('display_order', { ascending: true }),
    supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', adminInfo?.restaurant_id)
      .order('display_order', { ascending: true }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Menü Yönetimi</h1>
          <p className="text-slate-600 mt-1">
            Menü kategorilerini ve ürünleri yönetin
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/menu/categories/new">
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              Yeni Kategori
            </Button>
          </Link>
          <Link href="/dashboard/menu/items/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Ürün
            </Button>
          </Link>
        </div>
      </div>

      <MenuCategoriesList 
        categories={categories || []} 
        items={items || []}
      />
    </div>
  )
}
