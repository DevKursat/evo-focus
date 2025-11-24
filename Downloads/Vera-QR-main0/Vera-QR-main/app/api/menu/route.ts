import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug parameter is required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get organization
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'active')
      .maybeSingle()

    if (orgError || !organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Get categories
    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('visible', true)
      .order('display_order', { ascending: true })

    if (categoriesError) {
      throw categoriesError
    }

    // Get menu items
    const { data: menuItems, error: itemsError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('available', true)
      .order('display_order', { ascending: true })

    if (itemsError) {
      throw itemsError
    }

    // Get active campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('organization_id', organization.id)
      .eq('active', true)
      .or(`start_date.is.null,start_date.lte.${new Date().toISOString()}`)
      .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)

    // Organize items by category
    const menuByCategory = categories?.map(category => ({
      ...category,
      items: menuItems?.filter(item => item.category_id === category.id) || [],
    }))

    return NextResponse.json({
      organization,
      categories: menuByCategory || [],
      campaigns: campaigns || [],
    })
  } catch (error: any) {
    console.error('Menu API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
