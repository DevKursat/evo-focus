'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateSettings(formData: FormData) {
  const supabase = createClient()

  // Check auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const site_name = formData.get('site_name') as string
  const support_email = formData.get('support_email') as string
  const default_language = formData.get('default_language') as string
  const maintenance_mode = formData.get('maintenance_mode') === 'on'
  const security_2fa_required = formData.get('security_2fa_required') === 'on'
  const session_timeout_minutes = Number(formData.get('session_timeout_minutes'))
  const email_notifications_enabled = formData.get('email_notifications_enabled') === 'on'
  const system_notifications_enabled = formData.get('system_notifications_enabled') === 'on'

  // Check if settings exist
  const { data: existing } = await supabase
    .from('platform_settings')
    .select('id')
    .limit(1)
    .maybeSingle()

  let error
  if (existing) {
    const { error: updateError } = await supabase
      .from('platform_settings')
      .update({
        site_name,
        support_email,
        default_language,
        maintenance_mode,
        security_2fa_required,
        session_timeout_minutes,
        email_notifications_enabled,
        system_notifications_enabled,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
    error = updateError
  } else {
    const { error: insertError } = await supabase
      .from('platform_settings')
      .insert({
        site_name,
        support_email,
        default_language,
        maintenance_mode,
        security_2fa_required,
        session_timeout_minutes,
        email_notifications_enabled,
        system_notifications_enabled,
        updated_by: user.id
      })
    error = insertError
  }

  if (error) {
    console.error('Settings update error:', error)
    return { error: 'Failed to update settings' }
  }

  revalidatePath('/admin/settings')
  return { success: true }
}
