import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Plus, Download } from 'lucide-react'
import TablesManagement from '@/components/restaurant/tables-management'
import CreateQRDialogs from '@/components/restaurant/create-qr-dialogs'

export const dynamic = 'force-dynamic'

export default async function TablesPage() {
  const supabase = createClient()
  const adminInfo = await getRestaurantAdminInfo()

  if (!adminInfo) return null

  const { data: qrCodes } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('restaurant_id', adminInfo.restaurant_id)
    .order('created_at', { ascending: true })

  // Sort numerically if possible, fallback to string sort
  const sortedQrCodes = (qrCodes || []).sort((a, b) => {
    const numA = parseInt(a.table_number.replace(/\D/g, ''))
    const numB = parseInt(b.table_number.replace(/\D/g, ''))
    if (!isNaN(numA) && !isNaN(numB)) {
       if (numA === numB) return a.table_number.localeCompare(b.table_number)
       return numA - numB
    }
    return a.table_number.localeCompare(b.table_number)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Masalar & QR Kodlar</h1>
          <p className="text-slate-600 mt-1">
            Masa ve QR kodlarını yönetin
          </p>
        </div>
        <CreateQRDialogs restaurantId={adminInfo.restaurant_id} />
      </div>

      <TablesManagement
        qrCodes={sortedQrCodes}
        restaurant={adminInfo.restaurant}
      />
    </div>
  )
}
