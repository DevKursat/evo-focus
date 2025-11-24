import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MenuCategoryForm from '@/components/restaurant/menu-category-form'

export default async function NewCategoryPage() {
  const adminInfo = await getRestaurantAdminInfo()

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/menu">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Yeni Kategori Ekle</h1>
          <p className="text-slate-600 mt-1">Menüye yeni kategori ekleyin</p>
        </div>
      </div>

      <MenuCategoryForm
        restaurantId={adminInfo!.restaurant_id}
      />
    </div>
  )
}
