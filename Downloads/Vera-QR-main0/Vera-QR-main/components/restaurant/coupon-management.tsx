'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Ticket, Plus, Copy, Trash2, Eye, EyeOff } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Coupon {
  id: string
  code: string
  description: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  min_order_amount: number | null
  max_uses: number | null
  used_count: number
  valid_from: string
  valid_until: string
  is_active: boolean
  created_at: string
}

interface Props {
  restaurantId: string
}

export default function CouponManagement({ restaurantId }: Props) {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage' as 'percentage' | 'fixed',
    discount_value: '',
    min_order_amount: '',
    max_uses: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
  })
  const { toast } = useToast()

  const fetchCoupons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCoupons(data || [])
    } catch (error) {
      console.error('Error fetching coupons:', error)
      toast({
        title: 'Hata',
        description: 'Kuponlar yüklenemedi',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId, toast])

  useEffect(() => {
    fetchCoupons()
  }, [restaurantId, fetchCoupons])

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let code = ''
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setFormData({ ...formData, code })
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.code || !formData.discount_value) {
      toast({
        title: 'Uyarı',
        description: 'Lütfen gerekli alanları doldurun',
        variant: 'destructive',
      })
      return
    }

    try {
      const { error } = await (supabase.from('coupons') as any).insert({
        restaurant_id: restaurantId,
        code: formData.code.toUpperCase(),
        description: formData.description,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_order_amount: formData.min_order_amount
          ? parseFloat(formData.min_order_amount)
          : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until || null,
        is_active: true,
        used_count: 0,
      })

      if (error) throw error

      toast({
        title: 'Başarılı',
        description: 'Kupon oluşturuldu',
      })

      setShowCreateForm(false)
      setFormData({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: '',
        min_order_amount: '',
        max_uses: '',
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
      })
      fetchCoupons()
    } catch (error: any) {
      console.error('Error creating coupon:', error)
      toast({
        title: 'Hata',
        description: error.message || 'Kupon oluşturulamadı',
        variant: 'destructive',
      })
    }
  }

  const handleToggleActive = async (couponId: string, currentState: boolean) => {
    try {
      const { error } = await (supabase
        .from('coupons') as any)
        .update({ is_active: !currentState })
        .eq('id', couponId)

      if (error) throw error

      toast({
        title: 'Başarılı',
        description: `Kupon ${!currentState ? 'aktif' : 'pasif'} edildi`,
      })

      fetchCoupons()
    } catch (error) {
      console.error('Error toggling coupon:', error)
      toast({
        title: 'Hata',
        description: 'Durum değiştirilemedi',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (couponId: string) => {
    if (!confirm('Bu kuponu silmek istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', couponId)

      if (error) throw error

      toast({
        title: 'Başarılı',
        description: 'Kupon silindi',
      })

      fetchCoupons()
    } catch (error) {
      console.error('Error deleting coupon:', error)
      toast({
        title: 'Hata',
        description: 'Kupon silinemedi',
        variant: 'destructive',
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Kopyalandı',
      description: 'Kupon kodu panoya kopyalandı',
    })
  }

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.discount_type === 'percentage') {
      return `%${coupon.discount_value} İndirim`
    }
    return `₺${coupon.discount_value} İndirim`
  }

  const isExpired = (validUntil: string | null) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
  }

  const getStats = () => {
    const total = coupons.length
    const active = coupons.filter((c) => c.is_active && !isExpired(c.valid_until)).length
    const used = coupons.reduce((sum, c) => sum + c.used_count, 0)
    const expired = coupons.filter((c) => isExpired(c.valid_until)).length

    return { total, active, used, expired }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    )
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Kupon</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Aktif Kupon</CardDescription>
            <CardTitle className="text-3xl">{stats.active}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Kullanım Sayısı</CardDescription>
            <CardTitle className="text-3xl">{stats.used}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Süresi Dolmuş</CardDescription>
            <CardTitle className="text-3xl">{stats.expired}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Create Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Kupon Yönetimi</CardTitle>
              <CardDescription>
                İndirim kuponları oluşturun ve yönetin
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Kupon
            </Button>
          </div>
        </CardHeader>
        {showCreateForm && (
          <CardContent className="border-t pt-6">
            <form onSubmit={handleCreate} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Kupon Kodu</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                      placeholder="Örn: YENI20"
                      required
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateCouponCode}
                    >
                      Oluştur
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>İndirim Türü</Label>
                  <select
                    className="w-full px-3 py-2 border rounded-md"
                    value={formData.discount_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        discount_type: e.target.value as 'percentage' | 'fixed',
                      })
                    }
                  >
                    <option value="percentage">Yüzde (%)</option>
                    <option value="fixed">Sabit Tutar (₺)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Kupon açıklaması..."
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>İndirim Miktarı</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData({ ...formData, discount_value: e.target.value })
                    }
                    placeholder={formData.discount_type === 'percentage' ? '20' : '50'}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Min. Sipariş (₺)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.min_order_amount}
                    onChange={(e) =>
                      setFormData({ ...formData, min_order_amount: e.target.value })
                    }
                    placeholder="Opsiyonel"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Maks. Kullanım</Label>
                  <Input
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) =>
                      setFormData({ ...formData, max_uses: e.target.value })
                    }
                    placeholder="Sınırsız"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Başlangıç Tarihi</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_from: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>Bitiş Tarihi (Opsiyonel)</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) =>
                      setFormData({ ...formData, valid_until: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit">Oluştur</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  İptal
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Coupons List */}
      <div className="space-y-4">
        {coupons.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Ticket className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Henüz kupon oluşturulmadı</p>
            </CardContent>
          </Card>
        ) : (
          coupons.map((coupon) => {
            const expired = isExpired(coupon.valid_until)
            const usageLimit = coupon.max_uses
              ? `${coupon.used_count}/${coupon.max_uses}`
              : `${coupon.used_count} kullanım`

            return (
              <Card
                key={coupon.id}
                className={!coupon.is_active || expired ? 'opacity-60' : ''}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="px-4 py-2 bg-primary/10 rounded-lg">
                          <code className="text-xl font-bold text-primary">
                            {coupon.code}
                          </code>
                        </div>
                        <Badge variant="outline">{getDiscountText(coupon)}</Badge>
                        {!coupon.is_active && (
                          <Badge variant="secondary">Pasif</Badge>
                        )}
                        {expired && <Badge variant="destructive">Süresi Doldu</Badge>}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3">
                        {coupon.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Kullanım: </span>
                          <span className="font-medium">{usageLimit}</span>
                        </div>
                        {coupon.min_order_amount && (
                          <div>
                            <span className="text-muted-foreground">
                              Min. Sipariş:{' '}
                            </span>
                            <span className="font-medium">
                              ₺{coupon.min_order_amount}
                            </span>
                          </div>
                        )}
                        <div>
                          <span className="text-muted-foreground">Başlangıç: </span>
                          <span className="font-medium">
                            {new Date(coupon.valid_from).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        {coupon.valid_until && (
                          <div>
                            <span className="text-muted-foreground">Bitiş: </span>
                            <span className="font-medium">
                              {new Date(coupon.valid_until).toLocaleDateString(
                                'tr-TR'
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => copyToClipboard(coupon.code)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          handleToggleActive(coupon.id, coupon.is_active)
                        }
                      >
                        {coupon.is_active ? (
                          <Eye className="h-4 w-4" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleDelete(coupon.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
