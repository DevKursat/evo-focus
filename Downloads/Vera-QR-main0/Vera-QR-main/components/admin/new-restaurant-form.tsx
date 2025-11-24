'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Upload, X, Lock, Mail, Plus, Trash2 } from 'lucide-react'
import { slugify } from '@/lib/utils'
import GooglePlacesAutocomplete from './google-places-autocomplete'
import SlugInput from '@/components/admin/slug-input'
import { createRestaurantWithAdmin } from '@/app/admin/restaurants/actions'

const BRAND_COLORS = [
  '#000000', '#EF4444', '#F59E0B', '#10B981', '#3B82F6', 
  '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316',
]

const PERSONALITY_OPTIONS = [
  { value: 'friendly', label: 'Samimi', description: 'Dostane ve sıcak' },
  { value: 'professional', label: 'Profesyonel', description: 'Resmi ve bilgili' },
  { value: 'fun', label: 'Eğlenceli', description: 'Neşeli ve şakacı' },
  { value: 'formal', label: 'Resmi', description: 'Ciddi ve otoriter' },
  { value: 'casual', label: 'Rahat', description: 'Gevşek ve arkadaşça' },
]

export default function NewRestaurantForm() {
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    address: '',
    brand_color: '#3B82F6',
    working_hours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '10:00', close: '23:00', closed: false },
      sunday: { open: '10:00', close: '21:00', closed: false },
    },
    ai_personality: 'professional',
    openai_api_key: '',
    categories: ['Yemek', 'İçecek', 'Tatlı'],

    // Admin User (Primary)
    admin_email: '',
    admin_password: '',

    // Additional Admins
    admins: [] as { name: string; email: string }[]
  })

  // New Admin State
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '' })

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: slugify(name),
    })
  }

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

  const uploadLogo = async (restaurantId: string): Promise<string | null> => {
    if (!logoFile) return null

    const fileExt = logoFile.name.split('.').pop()
    const fileName = `${restaurantId}-${Date.now()}.${fileExt}`
    const filePath = `logos/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('restaurant-logos')
      .upload(filePath, logoFile)

    if (uploadError) {
      console.error('Logo upload error:', uploadError)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('restaurant-logos')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleAddAdmin = () => {
    if (newAdmin.email && newAdmin.name) {
      setFormData({
        ...formData,
        admins: [...formData.admins, newAdmin]
      })
      setNewAdmin({ name: '', email: '' })
    }
  }

  const handleRemoveAdmin = (index: number) => {
    const newAdmins = [...formData.admins]
    newAdmins.splice(index, 1)
    setFormData({
      ...formData,
      admins: newAdmins
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // 1. Upload logo first if exists
      let logoUrl = null
      if (logoFile) {
        // Temporary ID for logo path, we'll rename or just use it.
        // Since we don't have restaurant ID yet, we use timestamp.
        const tempId = `temp-${Date.now()}`
        logoUrl = await uploadLogo(tempId)
      }

      // 2. Call Server Action
      const result = await createRestaurantWithAdmin({
        ...formData,
        logo_url: logoUrl
      })

      if (result.error) {
        throw new Error(result.error)
      }

      toast({
        title: 'Başarılı!',
        description: `${formData.name} ve yönetici hesabı başarıyla oluşturuldu.`,
      })

      router.push('/admin/restaurants')
      router.refresh()
    } catch (error: any) {
      console.error('Error creating restaurant:', error)
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'İşletme oluşturulurken bir hata oluştu.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
          <CardDescription>
            İşletmenin temel bilgilerini girin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">İşletme Adı *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Örn: Bella Italia Restaurant"
              required
              disabled={isLoading}
            />
          </div>

          <SlugInput
            value={formData.slug}
            onChange={(val, isValid) => setFormData({ ...formData, slug: val })}
            disabled={isLoading}
          />

          <div className="space-y-2">
            <Label htmlFor="description">Kısa Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Örn: 3. Dalga Kahve ve Tatlı Evi"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Adres</Label>
            <GooglePlacesAutocomplete
              value={formData.address}
              onChange={(address) => setFormData({ ...formData, address })}
              placeholder="Adres ara veya manuel girin..."
            />
            <p className="text-xs text-muted-foreground">
              Google Maps ile ara veya manuel olarak girin
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Admin Account */}
      <Card className="border-blue-200 dark:border-blue-900/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Lock className="h-5 w-5" />
            Yönetici Hesapları
          </CardTitle>
          <CardDescription>
            Restoran yöneticilerini ve personeli belirleyin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Primary Admin */}
          <div className="space-y-4 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
            <h3 className="font-semibold text-sm text-blue-900 dark:text-blue-100 mb-2">Ana Yönetici</h3>
            <div className="space-y-2">
                <Label htmlFor="admin_email">E-posta Adresi *</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                    id="admin_email"
                    type="email"
                    className="pl-10"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                    placeholder="yonetici@restoran.com"
                    required
                    disabled={isLoading}
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="admin_password">Şifre *</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                    id="admin_password"
                    type="password"
                    className="pl-10"
                    value={formData.admin_password}
                    onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                    placeholder="Güçlü bir şifre belirleyin"
                    minLength={6}
                    required
                    disabled={isLoading}
                    />
                </div>
            </div>
          </div>

          {/* Additional Admins */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Diğer Yöneticiler (Opsiyonel)</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="space-y-2">
                    <Label>Ad Soyad</Label>
                    <Input
                        placeholder="Ahmet Yılmaz"
                        value={newAdmin.name}
                        onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                        placeholder="ahmet@restoran.com"
                        type="email"
                        value={newAdmin.email}
                        onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                    />
                </div>
                <Button type="button" onClick={handleAddAdmin} variant="secondary">
                    <Plus className="h-4 w-4 mr-2" />
                    Ekle
                </Button>
            </div>

            {/* List */}
            {formData.admins.length > 0 && (
                <div className="border rounded-md divide-y">
                    {formData.admins.map((admin, i) => (
                        <div key={i} className="p-3 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
                            <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-xs">
                                    {admin.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{admin.name}</p>
                                    <p className="text-xs text-slate-500">{admin.email}</p>
                                </div>
                            </div>
                            <Button size="icon" variant="ghost" className="text-red-500" onClick={() => handleRemoveAdmin(i)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Marka & Görsel</CardTitle>
          <CardDescription>
            Logo ve marka rengini ayarlayın
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Logo</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative w-24 h-24 rounded-lg border-2 border-slate-200 overflow-hidden">
                  <Image
                    src={logoPreview}
                    alt="Logo preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null)
                      setLogoPreview(null)
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
                    disabled={isLoading}
                  />
                </label>
              )}
              <div className="text-sm text-slate-500">
                <p>PNG, JPG veya SVG (maks. 2MB)</p>
                <p>Önerilen: 512x512px</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Marka Rengi</Label>
            <div className="flex items-center gap-2">
              {BRAND_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData({ ...formData, brand_color: color })}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    formData.brand_color === color
                      ? 'ring-2 ring-offset-2 ring-blue-600 scale-110'
                      : ''
                  }`}
                  style={{ backgroundColor: color }}
                  disabled={isLoading}
                />
              ))}
              <Input
                type="color"
                value={formData.brand_color}
                onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                className="w-20 h-10"
                disabled={isLoading}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle>AI Asistan Ayarları</CardTitle>
          <CardDescription>
            Müşterilerle konuşacak AI asistanın kişiliğini seçin
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PERSONALITY_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData({ ...formData, ai_personality: option.value })}
                className={`p-4 rounded-lg border-2 text-left transition-all ${
                  formData.ai_personality === option.value
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-white'
                    : 'border-slate-200 dark:border-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
                disabled={isLoading}
              >
                <div className="font-semibold">{option.label}</div>
                <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{option.description}</div>
              </button>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t">
            <Label htmlFor="openai_api_key">
              OpenAI API Key (Opsiyonel)
              <span className="text-xs text-muted-foreground ml-2">
                Boş bırakırsanız platform varsayılanı kullanılır
              </span>
            </Label>
            <Input
              id="openai_api_key"
              type="password"
              value={formData.openai_api_key || ''}
              onChange={(e) => setFormData({ ...formData, openai_api_key: e.target.value })}
              placeholder="sk-..."
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Her restoran kendi OpenAI API key&apos;ini kullanabilir. 
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1"
              >
                API key almak için tıklayın
              </a>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          İptal
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Oluşturuluyor...
            </>
          ) : (
            'İşletme Oluştur'
          )}
        </Button>
      </div>
    </form>
  )
}
