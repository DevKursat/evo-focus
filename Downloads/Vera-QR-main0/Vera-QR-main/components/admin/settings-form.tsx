'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Loader2 } from 'lucide-react'
import { updateSettings } from '@/app/admin/settings/actions'

interface SettingsFormProps {
  initialData?: {
    site_name: string
    support_email: string
    default_language: string
    maintenance_mode: boolean
    security_2fa_required: boolean
    session_timeout_minutes: number
    email_notifications_enabled: boolean
    system_notifications_enabled: boolean
  }
}

export default function SettingsForm({ initialData }: SettingsFormProps) {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    const formData = new FormData(event.currentTarget)

    const result = await updateSettings(formData)

    setIsLoading(false)

    if (result.error) {
      toast({
        title: "Hata",
        description: "Ayarlar kaydedilemedi.",
        variant: "destructive"
      })
    } else {
      toast({
        title: "Ayarlar kaydedildi",
        description: "Platform ayarları başarıyla güncellendi.",
      })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="security">Güvenlik</TabsTrigger>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          <TabsTrigger value="maintenance">Bakım Modu</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Genel Ayarlar</CardTitle>
              <CardDescription>
                Platformun temel yapılandırma ayarları.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site_name">Platform Adı</Label>
                <Input id="site_name" name="site_name" defaultValue={initialData?.site_name || 'Vera QR'} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support_email">Destek E-posta Adresi</Label>
                <Input id="support_email" name="support_email" type="email" defaultValue={initialData?.support_email || 'support@veraqr.com'} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_language">Varsayılan Dil</Label>
                <select
                  id="default_language"
                  name="default_language"
                  defaultValue={initialData?.default_language || 'tr'}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Ayarları</CardTitle>
              <CardDescription>
                Platform güvenliği ve erişim kontrolleri.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="security_2fa_required" className="flex flex-col space-y-1">
                  <span>İki Faktörlü Doğrulama (2FA) Zorunluluğu</span>
                  <span className="font-normal text-xs text-muted-foreground">Admin kullanıcıları için 2FA zorunlu tutulsun mu?</span>
                </Label>
                <Switch id="security_2fa_required" name="security_2fa_required" defaultChecked={initialData?.security_2fa_required} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_timeout_minutes">Oturum Zaman Aşımı (Dakika)</Label>
                <Input id="session_timeout_minutes" name="session_timeout_minutes" type="number" defaultValue={initialData?.session_timeout_minutes || 60} required />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Ayarları</CardTitle>
              <CardDescription>
                Sistem bildirimleri ve e-posta ayarları.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="email_notifications_enabled" className="flex flex-col space-y-1">
                  <span>E-posta Bildirimleri</span>
                  <span className="font-normal text-xs text-muted-foreground">Yeni üyeliklerde adminlere e-posta gönder.</span>
                </Label>
                <Switch id="email_notifications_enabled" name="email_notifications_enabled" defaultChecked={initialData?.email_notifications_enabled} />
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="system_notifications_enabled" className="flex flex-col space-y-1">
                  <span>Sistem Uyarıları</span>
                  <span className="font-normal text-xs text-muted-foreground">Kritik hatalarda dashboard bildirimi göster.</span>
                </Label>
                <Switch id="system_notifications_enabled" name="system_notifications_enabled" defaultChecked={initialData?.system_notifications_enabled} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Bakım Modu</CardTitle>
              <CardDescription>
                Platformu geçici olarak kullanıma kapatın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="rounded-md bg-amber-50 p-4 dark:bg-amber-900/20">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Dikkat
                    </h3>
                    <div className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                      <p>
                        Bakım modu açıldığında, admin paneli hariç tüm platform erişime kapatılacaktır.
                        Kullanıcılara bakım sayfası gösterilecektir.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="maintenance_mode" className="flex flex-col space-y-1">
                  <span>Bakım Modunu Aktifleştir</span>
                </Label>
                <Switch id="maintenance_mode" name="maintenance_mode" defaultChecked={initialData?.maintenance_mode} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <div className="mt-4 flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Değişiklikleri Kaydet
          </Button>
        </div>
      </Tabs>
    </form>
  )
}
