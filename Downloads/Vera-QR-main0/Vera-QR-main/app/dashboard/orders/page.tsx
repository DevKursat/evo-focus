import { getRestaurantAdminInfo } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import OrdersDashboard from '@/components/restaurant/orders-dashboard'

export const dynamic = 'force-dynamic'

export default async function OrdersPage() {
  const supabase = createClient()
  const adminInfo = await getRestaurantAdminInfo()

  // Note: We don't have a table relation here anymore because 'qr_codes' is the table name
  // and the schema defines qr_code_id.
  // We can fetch qr_codes separately or join if needed, but for now let's just get orders.
  // If we need table info, we'd join qr_codes on qr_code_id.

  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      *,
      qr_code:qr_codes(table_number, location_description),
      items:order_items(product_id, product_name, product_price, quantity, notes)
    `)
    .eq('restaurant_id', adminInfo?.restaurant_id)
    .order('created_at', { ascending: false })
    .limit(100)

  if (ordersError) {
    console.error('Orders fetch error:', ordersError)
  }

  console.log('Fetched orders count:', orders?.length)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Siparişler</h1>
        <p className="text-slate-600 mt-1">
          Tüm siparişleri görüntüleyin ve yönetin
        </p>
      </div>

      <OrdersDashboard
        initialOrders={orders || []}
        restaurantId={adminInfo!.restaurant_id}
      />
    </div>
  )
}
