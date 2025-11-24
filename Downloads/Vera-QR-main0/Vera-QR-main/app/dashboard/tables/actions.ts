'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function createSingleQRCode(restaurantId: string, formData: FormData) {
  const supabase = createClient()

  const table_number = formData.get('table_number') as string
  const location_description = formData.get('location_description') as string

  // Check duplicate table number
  const { data: existing } = await supabase
    .from('qr_codes')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('table_number', table_number)
    .maybeSingle()

  if (existing) {
    return { error: 'Bu masa numarası zaten mevcut' }
  }

  const qr_code_hash = crypto.randomBytes(16).toString('hex')

  const { error } = await supabase
    .from('qr_codes')
    .insert({
      restaurant_id: restaurantId,
      table_number,
      location_description,
      qr_code_hash,
      status: 'active'
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/tables')
  return { success: true }
}

export async function createBulkQRCodes(restaurantId: string, formData: FormData) {
  const supabase = createClient()

  const prefix = formData.get('prefix') as string // e.g. "Masa"
  const start = parseInt(formData.get('start') as string)
  const end = parseInt(formData.get('end') as string)
  const location_description = formData.get('location_description') as string

  if (start > end) {
    return { error: 'Başlangıç numarası bitişten büyük olamaz' }
  }

  if ((end - start) > 100) {
    return { error: 'Tek seferde en fazla 100 masa oluşturabilirsiniz' }
  }

  const newCodes = []
  const existingCheckNumbers = []

  // Prepare data
  for (let i = start; i <= end; i++) {
    const tableNum = `${prefix} ${i}`.trim()
    existingCheckNumbers.push(tableNum)
    newCodes.push({
      restaurant_id: restaurantId,
      table_number: tableNum,
      location_description: location_description || null,
      qr_code_hash: crypto.randomBytes(16).toString('hex'),
      status: 'active'
    })
  }

  // Check duplicates
  const { data: duplicates } = await supabase
    .from('qr_codes')
    .select('table_number')
    .eq('restaurant_id', restaurantId)
    .in('table_number', existingCheckNumbers)

  if (duplicates && duplicates.length > 0) {
    return { error: `Şu masalar zaten mevcut: ${duplicates.map((d: any) => d.table_number).join(', ')}` }
  }

  const { error } = await supabase
    .from('qr_codes')
    .insert(newCodes)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/tables')
  return { success: true }
}
