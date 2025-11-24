import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import MenuCategoryForm from '@/components/restaurant/menu-category-form'
import { notFound } from 'next/navigation'

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
    const supabase = createClient()
    const adminInfo = await getRestaurantAdminInfo()

    const { data: category } = await supabase
        .from('categories')
        .select('*')
        .eq('id', params.id)
        .eq('restaurant_id', adminInfo?.restaurant_id)
        .single()

    if (!category) {
        notFound()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/menu">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">Kategori Düzenle</h1>
                    <p className="text-slate-600 mt-1">Kategori bilgilerini güncelleyin</p>
                </div>
            </div>

            <MenuCategoryForm
                restaurantId={adminInfo!.restaurant_id}
                category={category}
            />
        </div>
    )
}
