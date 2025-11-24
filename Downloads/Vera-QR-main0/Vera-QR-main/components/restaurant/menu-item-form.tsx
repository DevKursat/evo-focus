'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import Image from 'next/image'
import { Loader2, Upload, X } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface Props {
  restaurantId: string
  categories: Category[]
  item?: any
}

export default function MenuItemForm({ restaurantId, categories, item }: Props) {
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url || null)

  const [formData, setFormData] = useState({
    category_id: item?.category_id || categories[0]?.id || '',
    name: item?.name_tr || '',
    description: item?.description_tr || '',
    price: item?.price || '',
    available: item?.is_available ?? true,
    stock_count: item?.stock_count || '',
    allergens: item?.allergens?.join(', ') || '',
  })

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadImage = async (itemId: string): Promise<string | null> => {
    if (!imageFile) return null

    const fileExt = imageFile.name.split('.').pop()
    const fileName = `${itemId}-${Date.now()}.${fileExt}`
    const filePath = `product-images/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageFile)

    if (uploadError) {
      console.error('Image upload error:', uploadError)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const itemData = {
        restaurant_id: restaurantId,
        category_id: formData.category_id,
        name_tr: formData.name, // Defaulting to TR for single language form
        description_tr: formData.description,
        price: parseFloat(formData.price as string),
        is_available: formData.available,
        stock_count: formData.stock_count ? parseInt(formData.stock_count as string) : null,
        allergens: formData.allergens
          ? formData.allergens.split(',').map((a: string) => a.trim()).filter(Boolean)
          : [],
      }

      let itemId = item?.id

      if (item) {
        // Update existing item
        const { error } = await (supabase
          .from('products') as any)
          .update(itemData)
          .eq('id', item.id)

        if (error) throw error
      } else {
        // Create new item
        const { data: newItem, error } = await (supabase
          .from('products') as any)
          .insert(itemData)
          .select()
          .single()

        if (error) throw error
        itemId = newItem.id
      }

      // Upload image if provided
      if (imageFile && itemId) {
        const imageUrl = await uploadImage(itemId)
        if (imageUrl) {
          await (supabase
            .from('products') as any)
            .update({ image_url: imageUrl })
            .eq('id', itemId)
        }
      }

      toast({
        title: 'Başarılı!',
        description: item ? 'Ürün güncellendi.' : 'Ürün eklendi.',
      })

      router.push('/dashboard/menu')
      router.refresh()
    } catch (error: any) {
      console.error('Error saving item:', error)
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message || 'Ürün kaydedilirken bir hata oluştu.',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ürün Bilgileri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Kategori *</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) =>
                setFormData({ ...formData, category_id: value })
              }
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Kategori seçin" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Ürün Adı *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Örn: Margherita Pizza"
              required
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ürün açıklaması"
              rows={3}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Fiyat (₺) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="0.00"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock_count">Stok Adedi</Label>
              <Input
                id="stock_count"
                type="number"
                value={formData.stock_count}
                onChange={(e) =>
                  setFormData({ ...formData, stock_count: e.target.value })
                }
                placeholder="Sınırsız"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="allergens">Alerjenler (virgülle ayırın)</Label>
            <Input
              id="allergens"
              value={formData.allergens}
              onChange={(e) =>
                setFormData({ ...formData, allergens: e.target.value })
              }
              placeholder="Örn: Süt, Yumurta, Fıstık"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="available">Müsait / Satışta</Label>
              <p className="text-sm text-slate-500">
                Ürün menüde görünsün mü?
              </p>
            </div>
            <Switch
              id="available"
              checked={formData.available}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, available: checked })
              }
              disabled={isLoading}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ürün Görseli</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            {imagePreview ? (
              <div className="relative w-48 h-48 rounded-lg border-2 border-slate-200 overflow-hidden">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null)
                    setImagePreview(null)
                  }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <label className="w-48 h-48 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-slate-400 transition-colors">
                <Upload className="h-12 w-12 text-slate-400 mb-2" />
                <span className="text-sm text-slate-500">Görsel Yükle</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isLoading}
                />
              </label>
            )}
            <div className="text-sm text-slate-500">
              <p>• PNG, JPG veya WebP</p>
              <p>• Maksimum 5MB</p>
              <p>• Önerilen: 800x800px</p>
            </div>
          </div>
        </CardContent>
      </Card>

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
              Kaydediliyor...
            </>
          ) : item ? (
            'Güncelle'
          ) : (
            'Ürün Ekle'
          )}
        </Button>
      </div>
    </form>
  )
}
