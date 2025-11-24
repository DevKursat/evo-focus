'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { supabase } from '@/lib/supabase/client'
import { Settings, Plug, Palette, Globe, Lock } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import GeneralSettings from '@/components/restaurant/settings/general-settings'
import AppearanceSettings from '@/components/restaurant/settings/appearance-settings'

export default function SettingsPage() {
  const { toast } = useToast()
  const { t, language } = useApp()
  const [loading, setLoading] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookConfigId, setWebhookConfigId] = useState<string | null>(null)
  const [testingWebhook, setTestingWebhook] = useState(false)
  const [restaurantId, setRestaurantId] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState('integrations')

  // Load restaurant ID on mount
  useEffect(() => {
    const loadRestaurantId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          return
        }

        const { data: adminData } = await supabase
          .from('restaurant_admins')
          .select('restaurant_id')
          .eq('profile_id', user.id)
          .maybeSingle()

        if (!adminData) {
          return
        }

        const restId = (adminData as any).restaurant_id
        setRestaurantId(restId)

        // Fetch from webhook_configs
        const { data: webhookData } = await supabase
          .from('webhook_configs')
          .select('id, url')
          .eq('restaurant_id', restId)
          .eq('name', 'CRM Integration')
          .maybeSingle()

        if (webhookData) {
          setWebhookUrl(webhookData.url)
          setWebhookConfigId(webhookData.id)
        }
      } catch (error) {
        console.error('Error loading settings:', error)
      }
    }

    loadRestaurantId()
  }, [])

  const handleSaveWebhook = async () => {
    setLoading(true)
    try {
      // Get current user's restaurant
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: adminData } = await supabase
        .from('restaurant_admins')
        .select('restaurant_id')
        .eq('profile_id', user.id)
        .single()

      if (!adminData) throw new Error('Restaurant not found')

      const restId = (adminData as any).restaurant_id

      // Upsert into webhook_configs
      const configData = {
        restaurant_id: restId,
        name: 'CRM Integration',
        url: webhookUrl,
        secret_key: 'default-secret', // In a real app, generate this securely
        events: ['order.created', 'order.updated', 'order.completed', 'order.cancelled'],
        is_active: !!webhookUrl,
        retry_enabled: true,
        max_retries: 3,
        timeout_seconds: 10
      }

      let error;

      if (webhookConfigId) {
        const { error: updateError } = await supabase
          .from('webhook_configs')
          .update(configData)
          .eq('id', webhookConfigId)
        error = updateError;
      } else {
        const { data: newConfig, error: insertError } = await supabase
          .from('webhook_configs')
          .insert(configData)
          .select()
          .single()

        if (newConfig) {
          setWebhookConfigId(newConfig.id)
        }
        error = insertError;
      }

      if (error) throw error

      toast({
        title: language === 'tr' ? 'Başarılı' : 'Success',
        description: language === 'tr' ? 'Webhook URL kaydedildi' : 'Webhook URL saved',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'tr' ? 'Hata' : 'Error',
        description: error.message,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTestWebhook = async () => {
    if (!webhookUrl) {
      toast({
        variant: 'destructive',
        title: language === 'tr' ? 'Hata' : 'Error',
        description: language === 'tr' ? 'Lütfen önce webhook URL girin' : 'Please enter webhook URL first',
      })
      return
    }

    setTestingWebhook(true)
    try {
      const testPayload = {
        event: 'test',
        timestamp: new Date().toISOString(),
        data: {
          message: language === 'tr' ? 'Bu bir test mesajıdır' : 'This is a test message',
          restaurant_id: restaurantId || 'test-id',
        },
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Event': 'test',
        },
        body: JSON.stringify(testPayload),
      })

      if (response.ok) {
        toast({
          title: language === 'tr' ? 'Başarılı' : 'Success',
          description: language === 'tr'
            ? `Webhook testi başarılı! Durum: ${response.status}`
            : `Webhook test successful! Status: ${response.status}`,
        })
      } else {
        toast({
          variant: 'destructive',
          title: language === 'tr' ? 'Webhook Hatası' : 'Webhook Error',
          description: language === 'tr'
            ? `Webhook yanıt vermedi. Durum: ${response.status}`
            : `Webhook failed. Status: ${response.status}`,
        })
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: language === 'tr' ? 'Bağlantı Hatası' : 'Connection Error',
        description: error.message,
      })
    } finally {
      setTestingWebhook(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold dark:text-white">
          {language === 'tr' ? 'Ayarlar' : 'Settings'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          {language === 'tr'
            ? 'Restoran ayarlarını ve entegrasyonları yönetin'
            : 'Manage restaurant settings and integrations'}
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex space-x-1 rounded-lg bg-slate-100 p-1 dark:bg-gray-800">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 ${activeTab === 'integrations'
                ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50'
              }`}
          >
            <Plug className="mr-2 h-4 w-4" />
            {language === 'tr' ? 'Entegrasyonlar' : 'Integrations'}
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 ${activeTab === 'general'
                ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50'
              }`}
          >
            <Settings className="mr-2 h-4 w-4" />
            {language === 'tr' ? 'Genel' : 'General'}
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-slate-950 dark:focus-visible:ring-slate-300 ${activeTab === 'appearance'
                ? 'bg-white text-slate-950 shadow-sm dark:bg-slate-950 dark:text-slate-50'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-50'
              }`}
          >
            <Palette className="mr-2 h-4 w-4" />
            {language === 'tr' ? 'Görünüm' : 'Appearance'}
          </button>
        </div>

        {activeTab === 'integrations' && (
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="dark:text-white">
                {language === 'tr' ? 'Webhook Entegrasyonu' : 'Webhook Integration'}
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                {language === 'tr'
                  ? 'Sipariş ve etkinlik bilgilerini kendi sisteminize gönderin'
                  : 'Send order and event information to your own system'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="webhook-url" className="dark:text-gray-200">
                  Webhook URL
                </Label>
                <Input
                  id="webhook-url"
                  type="url"
                  placeholder="https://your-domain.com/api/webhook"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'tr'
                    ? 'Olaylar (sipariş, yorum vb.) bu URL\'ye POST isteği olarak gönderilecektir'
                    : 'Events (orders, reviews, etc.) will be sent as POST requests to this URL'}
                </p>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border dark:border-gray-700">
                <h4 className="text-sm font-semibold mb-2 dark:text-white">
                  {language === 'tr' ? 'Webhook Olayları' : 'Webhook Events'}
                </h4>
                <ul className="text-sm space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• <code className="bg-white dark:bg-gray-800 px-1 rounded">order.created</code> - {language === 'tr' ? 'Yeni sipariş oluşturuldu' : 'New order created'}</li>
                  <li>• <code className="bg-white dark:bg-gray-800 px-1 rounded">order.updated</code> - {language === 'tr' ? 'Sipariş güncellendi' : 'Order updated'}</li>
                  <li>• <code className="bg-white dark:bg-gray-800 px-1 rounded">order.completed</code> - {language === 'tr' ? 'Sipariş tamamlandı' : 'Order completed'}</li>
                  <li>• <code className="bg-white dark:bg-gray-800 px-1 rounded">review.created</code> - {language === 'tr' ? 'Yeni yorum alındı' : 'New review received'}</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-200">
                  {language === 'tr' ? 'Örnek Webhook Payload' : 'Sample Webhook Payload'}
                </h4>
                <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded overflow-x-auto border dark:border-gray-700">
                  {`{
  "event": "order.created",
  "timestamp": "2024-11-19T12:00:00Z",
  "restaurant_id": "uuid",
  "data": {
    "order_id": "uuid",
    "table_number": "5",
    "total_amount": 150.00,
    "items": [...]
  }
}`}
                </pre>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSaveWebhook}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (language === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (language === 'tr' ? 'Kaydet' : 'Save')}
                </Button>
                <Button
                  onClick={handleTestWebhook}
                  disabled={testingWebhook || !webhookUrl}
                  variant="outline"
                  className="flex-1 dark:border-gray-600 dark:text-white dark:hover:bg-gray-700"
                >
                  {testingWebhook ? (language === 'tr' ? 'Test Ediliyor...' : 'Testing...') : (language === 'tr' ? 'Test Et' : 'Test')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'general' && (
          <div>
            {restaurantId ? (
              <GeneralSettings restaurantId={restaurantId} />
            ) : (
              <div className="p-4 text-center">Yükleniyor...</div>
            )}
          </div>
        )}

        {activeTab === 'appearance' && (
          <div>
            {restaurantId ? (
              <AppearanceSettings restaurantId={restaurantId} />
            ) : (
              <div className="p-4 text-center">Yükleniyor...</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
