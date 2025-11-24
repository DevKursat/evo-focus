import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MenuItemForm from '@/components/restaurant/menu-item-form'
import { notFound } from 'next/navigation'

export default async function EditMenuItemPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const adminInfo = await getRestaurantAdminInfo()

    const { data: item } = await supabase
        .from('products')
        .select('*')
        .eq('id', params.id)
        .eq('restaurant_id', adminInfo?.restaurant_id)
        .single()

    if (!item) {
        notFound()
    }

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
                    <h1 className="text-3xl font-bold">Ürün Düzenle</h1>
                    <p className="text-slate-600 mt-1">Ürün bilgilerini güncelleyin</p>
                </div>
            </div>

            <MenuItemForm
                restaurantId={adminInfo!.restaurant_id}
                categories={formattedCategories}
                item={item}
            />
        </div>
    )
}
