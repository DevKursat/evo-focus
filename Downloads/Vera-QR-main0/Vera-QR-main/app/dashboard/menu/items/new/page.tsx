import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MenuItemForm from '@/components/restaurant/menu-item-form'

export default async function NewMenuItemPage() {
  const supabase = createClient()
  const adminInfo = await getRestaurantAdminInfo()

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name_tr')
    .eq('restaurant_id', adminInfo?.restaurant_id)
    .order('display_order', { ascending: true })

  const formattedCategories = (categories || []).map(c => ({
    id: c.id,
    name: c.name_tr
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/menu">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yeni Ürün Ekle</h1>
          <p className="text-slate-600 mt-1">Menüye yeni ürün ekleyin</p>
        </div>
      </div>

      <MenuItemForm
        restaurantId={adminInfo!.restaurant_id}
        categories={formattedCategories}
      />
    </div>
  )
}
