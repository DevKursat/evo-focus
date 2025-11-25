import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import MenuCategoriesList from '@/components/restaurant/menu-categories-list'

export const dynamic = 'force-dynamic'

export default async function MenuPage() {
  // Use Service Role to bypass RLS for admin dashboard
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const adminInfo = await getRestaurantAdminInfo()
  if (!adminInfo) return <div>Erişim reddedildi</div>

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', adminInfo.restaurant_id)
    .order('display_order', { ascending: true })

  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', adminInfo.restaurant_id)
    .order('created_at', { ascending: false })

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
        items={products || []}
      />
    </div>
  )
}
