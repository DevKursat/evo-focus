import SettingsForm from '@/components/admin/settings-form'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const supabase = createClient()

  let initialData = {
    site_name: 'Vera QR',
    support_email: 'support@veraqr.com',
    default_language: 'tr',
    maintenance_mode: false,
    security_2fa_required: false,
    session_timeout_minutes: 60,
    email_notifications_enabled: true,
    system_notifications_enabled: true
  }

  try {
    const { data: settings, error } = await supabase
      .from('platform_settings')
      .select('*')
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching settings:', error)
    } else if (settings) {
      initialData = settings
    }
  } catch (e) {
    console.error('Unexpected error fetching settings:', e)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ayarlar</h1>
        <p className="text-slate-600 mt-1">
          Platform genel yapılandırma ve yönetim ayarları.
        </p>
      </div>
      <SettingsForm initialData={initialData} />
    </div>
  )
}
