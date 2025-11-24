'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Upload, X } from 'lucide-react'
import Image from 'next/image'

interface Props {
  restaurantId: string
}

const BRAND_COLORS = [
  '#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6',
  '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
]

export default function AppearanceSettings({ restaurantId }: Props) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    primary_color: '#3B82F6',
    logo_url: '',
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase
        .from('restaurants')
        .select('primary_color, logo_url')
        .eq('id', restaurantId)
        .single()

      if (data) {
        setFormData({
          primary_color: data.primary_color || '#3B82F6',
          logo_url: data.logo_url || '',
        })
        if (data.logo_url) setLogoPreview(data.logo_url)
      }
    }
    fetchSettings()
  }, [restaurantId])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return formData.logo_url

    const fileExt = logoFile.name.split('.').pop()
    const fileName = `${restaurantId}-${Date.now()}.${fileExt}`
    const filePath = `logos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('restaurant-logos')
      .upload(filePath, logoFile)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-logos')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      console.log('Uploading logo and updating appearance...')
      const logoUrl = await uploadLogo()

      console.log('Logo URL:', logoUrl)

      const response = await fetch('/api/restaurant/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primary_color: formData.primary_color,
          logo_url: logoUrl,
        }),
      })

      const result = await response.json()
      console.log('API response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update appearance')
      }

      toast({
        title: 'Başarılı',
        description: 'Görünüm ayarları güncellendi',
      })
    } catch (error: any) {
      console.error('Error saving appearance:', error)
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
          <CardTitle>Marka Kimliği</CardTitle>
          <CardDescription>Logo ve renklerinizi özelleştirin</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative w-24 h-24 rounded-lg border-2 border-slate-200 overflow-hidden">
                  <Image
                    src={logoPreview}
                    alt="Logo"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null)
                      setLogoPreview(null)
                      setFormData({ ...formData, logo_url: '' })
                    }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full z-10"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center cursor-pointer hover:border-slate-400 transition-colors">
                  <Upload className="h-8 w-8 text-slate-400" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              )}
              <div className="text-sm text-slate-500">
                <p>PNG, JPG veya SVG (maks. 2MB)</p>
                <p>Önerilen: 512x512px</p>
              </div>
            </div>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Ana Renk</Label>
            <div className="flex items-center gap-2 flex-wrap">
              {BRAND_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, primary_color: color })}
                  className={`w-10 h-10 rounded-lg transition-all ${formData.primary_color === color
                    ? 'ring-2 ring-offset-2 ring-blue-600 scale-110'
                    : ''
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <Input
                type="color"
                value={formData.primary_color}
                onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                className="w-20 h-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Görünümü Kaydet
        </Button>
      </div>
    </div>
  )
}
