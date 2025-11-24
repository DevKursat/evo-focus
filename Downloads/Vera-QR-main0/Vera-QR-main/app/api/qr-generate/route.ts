import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTableQRCode } from '@/lib/qr-generator'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { table_id, organization_slug } = body

    if (!table_id || !organization_slug) {
      return NextResponse.json(
        { error: 'table_id and organization_slug are required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Get table information
    const { data: table, error: tableError } = await supabase
      .from('tables')
      .select('*, organization:organizations(slug, name, brand_color)')
      .eq('id', table_id)
      .maybeSingle()

    if (tableError || !table) {
      return NextResponse.json(
        { error: 'Table not found' },
        { status: 404 }
      )
    }

    // Generate QR code
    const qrCodeDataURL = await generateTableQRCode(
      table.organization.slug,
      table.id,
      table.qr_code,
      table.organization.brand_color
    )

    return NextResponse.json({
      qr_code: qrCodeDataURL,
      table_number: table.table_number,
      organization_name: table.organization.name,
    })
  } catch (error: any) {
    console.error('QR Generation Error:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
