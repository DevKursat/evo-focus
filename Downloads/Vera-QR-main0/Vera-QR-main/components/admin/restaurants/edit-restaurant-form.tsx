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
import { Loader2, Save, AlertCircle, Lock, Mail } from 'lucide-react'
import { slugify } from '@/lib/utils'
import GooglePlacesAutocomplete from '@/components/admin/google-places-autocomplete'
import SlugInput from '@/components/admin/slug-input'
import { updateRestaurant, getRestaurantAdmins, addRestaurantAdmin, removeRestaurantAdmin } from '@/app/admin/restaurants/actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, Trash2, Users } from 'lucide-react'

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

export default function EditRestaurantForm({ restaurant }: { restaurant: any }) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('info')
  const [aiConfig, setAiConfig] = useState<any>(null)

  // Admin Management State
  const [admins, setAdmins] = useState<any[]>([])
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '' })

  // Form States
  const [formData, setFormData] = useState({
    name: restaurant.name || '',
    slug: restaurant.slug || '',
    description: restaurant.description || '',
    address: restaurant.address || '',
    brand_color: restaurant.primary_color || '#3B82F6',
    status: restaurant.status || 'active',
    subscription_tier: restaurant.subscription_tier || 'starter',
    working_hours: restaurant.working_hours || {},
    ai_personality: 'professional',
  })

  // Fetch Data on mount
  useEffect(() => {
    const fetchData = async () => {
      // Fetch AI Config
      const { data: ai } = await supabase
        .from('ai_configs')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .single()

      if (ai) {
        setAiConfig(ai)
        setFormData(prev => ({ ...prev, ai_personality: ai.personality }))
      }

      // Fetch Admins List
      fetchAdmins()
    }
    fetchData()
  }, [restaurant.id])

  const fetchAdmins = async () => {
    try {
      const data = await getRestaurantAdmins(restaurant.id)
      setAdmins(data)
    } catch (error) {
      console.error('Failed to fetch admins:', error)
    }
  }


  const handleUpdateInfo = async () => {
    setIsLoading(true)
    try {
      const result = await updateRestaurant(restaurant.id, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        address: formData.address,
        brand_color: formData.brand_color,
        status: formData.status,
        subscription_tier: formData.subscription_tier,
        working_hours: formData.working_hours,
        ai_personality: formData.ai_personality
      })

      if (result.error) throw new Error(result.error)

      toast({
        title: 'Başarılı',
        description: 'İşletme bilgileri güncellendi.',
      })
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Hata',
        description: error.message,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdmin.email || !newAdmin.name) {
        toast({ variant: 'destructive', title: 'Hata', description: 'Email ve isim zorunludur.' })
        return
    }

    setIsLoading(true)
    try {
      const result = await addRestaurantAdmin(
        restaurant.id,
        newAdmin.email.trim(),
        newAdmin.name.trim(),
        newAdmin.password || undefined
      )

      if (result.error) throw new Error(result.error)

      toast({ title: 'Başarılı', description: 'Yönetici eklendi.' })
      setIsAddAdminOpen(false)
      setNewAdmin({ name: '', email: '', password: '' })
      fetchAdmins()
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Hata', description: error.message })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveAdmin = async (profileId: string) => {
    if (!confirm('Bu yöneticiyi kaldırmak istediğinize emin misiniz?')) return

    try {
        const result = await removeRestaurantAdmin(restaurant.id, profileId)
        if (result.error) throw new Error(result.error)
        toast({ title: 'Başarılı', description: 'Yönetici kaldırıldı.' })
        fetchAdmins()
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'Hata', description: error.message })
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="info">Genel Bilgiler</TabsTrigger>
        <TabsTrigger value="theme">Görünüm & AI</TabsTrigger>
        <TabsTrigger value="admin">Yönetici Hesabı</TabsTrigger>
      </TabsList>

      {/* GENERAL INFO TAB */}
      <TabsContent value="info" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>İşletme Detayları</CardTitle>
            <CardDescription>Temel bilgileri düzenleyin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>İşletme Adı</Label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Durum</Label>
                    <Select
                        value={formData.status}
                        onValueChange={(val) => setFormData({...formData, status: val})}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Aktif</SelectItem>
                            <SelectItem value="suspended">Askıya Alındı</SelectItem>
                            <SelectItem value="pending">Onay Bekliyor</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <SlugInput
                value={formData.slug}
                onChange={(val, isValid) => setFormData({...formData, slug: val})}
                currentId={restaurant.id}
            />

            <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
            </div>

            <div className="space-y-2">
                <Label>Adres</Label>
                <Input
                    value={formData.address}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
            </div>

            <div className="space-y-2">
                <Label>Abonelik Paketi</Label>
                 <Select
                        value={formData.subscription_tier}
                        onValueChange={(val) => setFormData({...formData, subscription_tier: val})}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="starter">Başlangıç</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="enterprise">Kurumsal</SelectItem>
                        </SelectContent>
                    </Select>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={handleUpdateInfo} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Kaydet
                </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* THEME & AI TAB */}
      <TabsContent value="theme" className="space-y-4">
        <Card>
            <CardHeader>
                <CardTitle>Marka Rengi</CardTitle>
            </CardHeader>
            <CardContent>
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
                    />
                ))}
                <Input
                    type="color"
                    value={formData.brand_color}
                    onChange={(e) => setFormData({ ...formData, brand_color: e.target.value })}
                    className="w-20 h-10"
                />
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>AI Kişiliği</CardTitle>
            </CardHeader>
            <CardContent>
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
                    >
                        <div className="font-semibold">{option.label}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">{option.description}</div>
                    </button>
                    ))}
                </div>
                <div className="flex justify-end pt-6">
                    <Button onClick={handleUpdateInfo} disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Görünüm ve AI Ayarlarını Kaydet
                    </Button>
                </div>
            </CardContent>
        </Card>
      </TabsContent>

      {/* ADMIN MANAGEMENT TAB */}
      <TabsContent value="admin" className="space-y-4">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Ekip Yönetimi
                    </CardTitle>
                    <CardDescription>
                        Bu restorana erişimi olan yöneticileri düzenleyin.
                    </CardDescription>
                </div>
                <Dialog open={isAddAdminOpen} onOpenChange={setIsAddAdminOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Yönetici Ekle
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Yeni Yönetici Ekle</DialogTitle>
                            <DialogDescription>
                                Mevcut bir kullanıcıyı veya yeni bir hesabı ekleyin.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Ad Soyad</Label>
                                <Input
                                    value={newAdmin.name}
                                    onChange={(e) => setNewAdmin({...newAdmin, name: e.target.value})}
                                    placeholder="Ad Soyad"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={newAdmin.email}
                                    onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                                    placeholder="ornek@email.com"
                                    type="email"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Şifre (Opsiyonel)</Label>
                                <Input
                                    value={newAdmin.password}
                                    onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                                    placeholder="Sadece yeni hesap oluştururken gereklidir"
                                    type="password"
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddAdminOpen(false)}>İptal</Button>
                            <Button onClick={handleAddAdmin} disabled={isLoading}>
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Ekle'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ad Soyad</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Rol</TableHead>
                            <TableHead className="text-right">İşlem</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {admins.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                    Henüz yönetici eklenmemiş.
                                </TableCell>
                            </TableRow>
                        ) : (
                            admins.map((admin) => (
                                <TableRow key={admin.link_id}>
                                    <TableCell className="font-medium">{admin.profile?.full_name || 'İsimsiz'}</TableCell>
                                    <TableCell>{admin.profile?.email}</TableCell>
                                    <TableCell className="capitalize">{admin.profile?.role?.replace('_', ' ')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                            onClick={() => handleRemoveAdmin(admin.profile?.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
