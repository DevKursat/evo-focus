'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save } from 'lucide-react'
import GooglePlacesAutocomplete from '@/components/admin/google-places-autocomplete'

interface Props {
  restaurantId: string
}

export default function GeneralSettings({ restaurantId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [slugLoading, setSlugLoading] = useState(false)
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [originalSlug, setOriginalSlug] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    wifi_ssid: '',
    wifi_password: '',
  })
  const { toast } = useToast()

  useEffect(() => {
    const fetchRestaurant = async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single()

      if (data) {
        setFormData({
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          address: data.address || '',
          phone: (data as any).phone || '', // Assuming phone column exists or adding loosely
          email: (data as any).email || '',
          wifi_ssid: data.wifi_ssid || '',
          wifi_password: data.wifi_password || '',
        })
        setOriginalSlug(data.slug || '')
      }
    }
    fetchRestaurant()
  }, [restaurantId])

  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug === originalSlug) {
      setSlugAvailable(null)
      return
    }

    setSlugLoading(true)
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id')
        .eq('slug', slug)
        .neq('id', restaurantId)
        .maybeSingle()

      if (error) throw error
      setSlugAvailable(!data) // Available if no data found
    } catch (error) {
      console.error('Slug check error:', error)
      setSlugAvailable(null)
    } finally {
      setSlugLoading(false)
    }
  }

  const handleSlugSave = async () => {
    if (!formData.slug) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Slug boş olamaz',
      })
      return
    }

    if (slugAvailable === false) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: 'Bu slug kullanımda, lütfen başka bir slug seçin',
      })
      return
    }

    setSlugLoading(true)
    try {
      const response = await fetch('/api/restaurant/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: formData.slug }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update slug')
      }

      setOriginalSlug(formData.slug)
      setSlugAvailable(null)

      // Refresh the page to update server-rendered data (header, etc.)
      router.refresh()

      toast({
        title: 'Başarılı',
        description: 'Slug güncellendi ve sayfa yenilendi',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'Slug kaydedilemedi',
      })
    } finally {
      setSlugLoading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      console.log('Updating restaurant via API...', formData)

      const response = await fetch('/api/restaurant/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          wifi_ssid: formData.wifi_ssid,
          wifi_password: formData.wifi_password,
        }),
      })

      const result = await response.json()
      console.log('API response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update settings')
      }

      toast({
        title: 'Başarılı',
        description: 'Ayarlar güncellendi',
      })
    } catch (error: any) {
      console.error('Settings save error:', error)
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'Ayarlar kaydedilemedi',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
          <CardDescription>İşletmenizin temel bilgilerini düzenleyin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>İşletme Adı</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Slug (URL için)</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={formData.slug}
                  onChange={(e) => {
                    const newSlug = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-')
                    setFormData({ ...formData, slug: newSlug })
                    setSlugAvailable(null)
                  }}
                  onBlur={() => checkSlugAvailability(formData.slug)}
                  placeholder="ornek-restoran"
                  className={
                    slugAvailable === true ? 'border-green-500' :
                      slugAvailable === false ? 'border-red-500' : ''
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Menü URL&apos;i: {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/{formData.slug || 'slug'}
                </p>
                {slugAvailable === true && (
                  <p className="text-xs text-green-600 mt-1">✓ Slug kullanılabilir</p>
                )}
                {slugAvailable === false && (
                  <p className="text-xs text-red-600 mt-1">✗ Bu slug zaten kullanımda</p>
                )}
              </div>
              <Button
                type="button"
                variant={slugAvailable === true ? 'default' : 'outline'}
                onClick={() => {
                  if (slugAvailable === true) {
                    handleSlugSave()
                  } else {
                    checkSlugAvailability(formData.slug)
                  }
                }}
                disabled={slugLoading || !formData.slug || formData.slug === originalSlug}
              >
                {slugLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : slugAvailable === true ? (
                  'Kaydet'
                ) : (
                  'Kontrol Et'
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Açıklama</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Adres</Label>
            <GooglePlacesAutocomplete
              value={formData.address}
              onChange={(val) => setFormData({ ...formData, address: val })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Wi-Fi Bilgileri</CardTitle>
          <CardDescription>Müşterileriniz için QR menüde gösterilecek Wi-Fi bilgileri</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Wi-Fi Adı (SSID)</Label>
              <Input
                value={formData.wifi_ssid}
                onChange={(e) => setFormData({ ...formData, wifi_ssid: e.target.value })}
                placeholder="Misafir Agi"
              />
            </div>
            <div className="space-y-2">
              <Label>Wi-Fi Şifresi</Label>
              <Input
                value={formData.wifi_password}
                onChange={(e) => setFormData({ ...formData, wifi_password: e.target.value })}
                type="text"
                placeholder="sifre123"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Değişiklikleri Kaydet
        </Button>
      </div>
    </div>
  )
}
