// import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import QRCodeList from '@/components/admin/restaurants/qr-code-list'
import CreateQRDialog from '@/components/admin/restaurants/create-qr-dialog'
import { notFound } from 'next/navigation'

export default async function RestaurantQRPage({ params }: { params: { id: string } }) {
  // const supabase = createClient()

  // Fetch restaurant info
  // const { data: restaurant } = await supabase
  //   .from('restaurants')
  //   .select('name, slug')
  //   .eq('id', params.id)
  //   .single()

  const restaurant = {
    name: 'Test Restaurant',
    slug: 'test-restaurant'
  }

  // Fetch QR codes
  // const { data: qrCodes } = await supabase
  //   .from('qr_codes')
  //   .select('*')
  //   .eq('restaurant_id', params.id)
  //   .order('table_number', { ascending: true })

  const qrCodes = [
    {
      id: '1',
      table_number: 'Masa 1',
      location_description: 'Bahçe',
      qr_code_hash: 'hash1',
      status: 'active',
      scan_count: 120,
      created_at: new Date().toISOString()
    },
     {
      id: '2',
      table_number: 'Masa 2',
      location_description: 'İç Mekan',
      qr_code_hash: 'hash2',
      status: 'active',
      scan_count: 5,
      created_at: new Date().toISOString()
    }
  ]

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/restaurants">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">QR Kod Yönetimi</h1>
            <p className="text-slate-600 mt-1">
              {restaurant.name}
            </p>
          </div>
        </div>
        <CreateQRDialog restaurantId={params.id} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Masa QR Kodları ({qrCodes?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <QRCodeList qrCodes={qrCodes || []} restaurantSlug={restaurant.slug} />
        </CardContent>
      </Card>
    </div>
  )
}
