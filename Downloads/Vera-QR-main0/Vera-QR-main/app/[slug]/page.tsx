import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import RestaurantMenu from '@/components/customer/restaurant-menu'
import type { Metadata } from 'next'

interface Props {
  params: { slug: string }
  searchParams: { table?: string; qr?: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient()
  const { data: restaurant } = await supabase
    .from('restaurants')
    .select('name, description')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .maybeSingle()

  if (!restaurant) {
    return {
      title: 'Restoran Bulunamadı',
    }
  }

  return {
    title: `${restaurant.name} - Dijital Menü`,
    description: restaurant.description || `${restaurant.name} menüsünü görüntüleyin`,
  }
}

export default async function RestaurantPage({ params, searchParams }: Props) {
  const supabase = createClient()
  // Fetch restaurant
  const { data: restaurant, error: restaurantError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .maybeSingle()

  if (restaurantError || !restaurant) {
    notFound()
  }

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('visible', true)
    .order('display_order', { ascending: true })

  // Fetch menu items (products)
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_available', true)
    .order('display_order', { ascending: true })

  // Fetch active campaigns
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('active', true)
    .lte('start_date', new Date().toISOString())
    .gte('end_date', new Date().toISOString())

  // Fetch AI Config
  const { data: aiConfig } = await supabase
    .from('ai_configs')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .maybeSingle()

  // Get QR code info if provided
  let qrCodeInfo = null
  if (searchParams.qr) {
    const { data: qrCode } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('qr_code_hash', searchParams.qr)
      .eq('restaurant_id', restaurant.id)
      .maybeSingle()

    qrCodeInfo = qrCode
    
    // Update scan count
    if (qrCode) {
      await supabase
        .from('qr_codes')
        .update({ 
          scan_count: (qrCode.scan_count || 0) + 1,
          last_scanned_at: new Date().toISOString()
        })
        .eq('id', qrCode.id)
    }
  }

  // Organize menu by categories
  const menuByCategory = categories?.map(category => ({
    ...category,
    items: products?.filter(item => item.category_id === category.id) || [],
  })) || []

  return (
    <RestaurantMenu
      organization={restaurant}
      categories={menuByCategory}
      campaigns={campaigns || []}
      tableInfo={qrCodeInfo}
      aiConfig={aiConfig}
      allProducts={products || []}
    />
  )
}
