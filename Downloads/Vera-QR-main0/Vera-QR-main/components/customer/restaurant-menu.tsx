'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ShoppingCart, MessageCircle, MapPin, Clock, Phone, X, Plus, Minus, Bell, Languages, Search, Filter, Wifi, MessageSquare, Grid3x3, List, SlidersHorizontal, Star, Copy, Moon, Sun } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { formatCurrency, generateSessionId, getStatusColor } from '@/lib/utils'
import type { Database } from '@/lib/supabase/types'
import AIAssistantChat from './ai-assistant-chat'


// Helper to convert hex to HSL
const hexToHSL = (hex: string) => {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '142 76% 36%'; // Default emerald-600 if invalid
  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);
  r /= 255, g /= 255, b /= 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max == min) {
    h = s = 0; // achromatic
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}


type Restaurant = Database['public']['Tables']['restaurants']['Row']
type Product = Database['public']['Tables']['products']['Row']
type Category = Database['public']['Tables']['categories']['Row']
type AIConfig = Database['public']['Tables']['ai_configs']['Row']

// Define Campaign type if it's not in the database schema yet, or fetch it from DB if it exists.
// Based on provided schema, there is no 'campaigns' table. Assuming it might be passed as any or defined locally.
interface Campaign {
  id: string
  title: string
  description: string | null
  discount_percentage: number | null
}

interface CategoryWithItems extends Category {
  items: ProductWithDetails[]
  // Add these properties as they are used in the component but might be missing in strict DB type or added via join
  name: string
}

interface ProductWithDetails extends Product {
  name: string
  description: string | null
  allergens: string[]
}

interface Props {
  organization: Restaurant
  categories: CategoryWithItems[]
  campaigns: Campaign[]
  tableInfo: any
  aiConfig: AIConfig | null
  allProducts: Product[]
}

interface CartItem extends ProductWithDetails {
  quantity: number
  notes?: string
}

const LANGUAGES = [
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
]

export default function RestaurantMenu({ organization, categories, campaigns, tableInfo, aiConfig, allProducts }: Props) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [showAI, setShowAI] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ProductWithDetails | null>(null)
  const [sessionId] = useState(() => generateSessionId())
  const [customerName, setCustomerName] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('tr')
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [translatedCategories, setTranslatedCategories] = useState<CategoryWithItems[]>(categories)
  const [isTranslating, setIsTranslating] = useState(false)
  // Coupon state
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false)
  // UI enhancement state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showAIWelcome, setShowAIWelcome] = useState(true)
  // Advanced filters
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default')
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  // Reviews panel state
  const [showReviewsPanel, setShowReviewsPanel] = useState(false)
  const [reviewStarFilter, setReviewStarFilter] = useState<number | null>(null)
  // Product ratings map
  const [productRatings, setProductRatings] = useState<Record<string, { average: number; count: number }>>({})
  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark'
    }
    return false
  })

  // Toggle dark mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])
  const { toast } = useToast()

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const totalAmount = subtotal - discountAmount

  // Translation function
  const translateMenu = async (targetLang: string) => {
    if (targetLang === 'tr') {
      setTranslatedCategories(categories)
      return
    }

    setIsTranslating(true)
    try {
      const translated = await Promise.all(
        categories.map(async (category) => {
          const translatedItems = await Promise.all(
            category.items.map(async (item) => {
              const nameResponse = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: item.name,
                  target_language: targetLang,
                  organization_id: organization.id,
                  context: 'menu',
                }),
              })
              const nameData = await nameResponse.json()

              const descResponse = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  text: item.description || '',
                  target_language: targetLang,
                  organization_id: organization.id,
                  context: 'menu',
                }),
              })
              const descData = await descResponse.json()

              return {
                ...item,
                name: nameData.translated || item.name,
                description: descData.translated || item.description,
              }
            })
          )

          const catResponse = await fetch('/api/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: category.name,
              target_language: targetLang,
              organization_id: organization.id,
              context: 'menu',
            }),
          })
          const catData = await catResponse.json()

          return {
            ...category,
            name: catData.translated || category.name,
            items: translatedItems,
          }
        })
      )

      setTranslatedCategories(translated)
      toast({
        title: 'Çeviri Tamamlandı',
        description: `Menü ${LANGUAGES.find(l => l.code === targetLang)?.name} diline çevrildi`,
      })
    } catch (error) {
      toast({
        title: 'Çeviri Hatası',
        description: 'Menü çevrilemedi. Lütfen tekrar deneyin.',
        variant: 'destructive',
      })
    } finally {
      setIsTranslating(false)
    }
  }

  const addToCart = (item: ProductWithDetails, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + quantity } : i
        )
      }
      return [...prev, { ...item, quantity }]
    })

    // Use name_tr or name_en as fallback
    const productName = item.name || item.name_tr || item.name_en || 'Ürün'

    toast({
      title: 'Sepete Eklendi',
      description: `${productName} sepete eklendi`,
    })
  }

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => {
      const updated = prev.map(item => {
        if (item.id === itemId) {
          const newQuantity = Math.max(0, item.quantity + delta)
          return { ...item, quantity: newQuantity }
        }
        return item
      }).filter(item => item.quantity > 0)
      return updated
    })
  }

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId))
  }

  const applyCoupon = async () => {
    const code = couponCode.trim().toUpperCase()
    if (!code) {
      toast({
        title: 'Hata',
        description: 'Lütfen bir kupon kodu girin',
        variant: 'destructive',
      })
      return
    }

    setIsValidatingCoupon(true)
    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('restaurant_id', organization.id)
        .eq('is_active', true)
        .single()

      if (error || !coupon) {
        throw new Error('Geçersiz kupon kodu')
      }

      // Check if coupon has reached max usage
      if (coupon.max_usage && coupon.used_count >= coupon.max_usage) {
        throw new Error('Bu kupon kullanım limitine ulaşmış')
      }

      // Check validity dates
      const now = new Date()
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        throw new Error('Bu kupon henüz geçerli değil')
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        throw new Error('Bu kuponun süresi dolmuş')
      }

      // Check minimum purchase if required
      if (coupon.min_purchase && subtotal < coupon.min_purchase) {
        throw new Error(`Minimum ${coupon.min_purchase} TL alışveriş gerekli`)
      }

      setAppliedCoupon(coupon)

      // Calculate discount
      let discount = 0
      if (coupon.discount_type === 'percentage') {
        discount = subtotal * (coupon.discount_value / 100)
        if (coupon.max_discount) {
          discount = Math.min(discount, coupon.max_discount)
        }
      } else {
        discount = coupon.discount_value
      }

      setDiscountAmount(discount)

      // Increment usage count
      await supabase
        .from('coupons')
        .update({ used_count: (coupon.used_count || 0) + 1 })
        .eq('id', coupon.id)

      toast({
        title: 'Kupon Uygulandı!',
        description: `${discount.toFixed(2)} TL indirim kazandınız`,
      })
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Kupon doğrulanamadı',
        variant: 'destructive',
      })
    } finally {
      setIsValidatingCoupon(false)
    }
  }

  const submitOrder = async () => {
    if (cart.length === 0) {
      toast({
        title: 'Sepet Boş',
        description: 'Lütfen sipariş vermek için ürün ekleyin',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_id: organization.id,
          qr_code_id: tableInfo?.id,
          items: cart.map(item => ({
            product_id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            notes: item.notes,
          })),
          customer_name: customerName,
          customer_notes: customerNotes,
          session_id: sessionId,
        }),
      })

      if (!response.ok) {
        throw new Error('Order submission failed')
      }

      const data = await response.json()

      toast({
        title: 'Sipariş Alındı!',
        description: `Sipariş numaranız: ${data.order.order_number}`,
      })

      setCart([])
      setShowCart(false)
      setCustomerName('')
      setCustomerNotes('')
    } catch (error) {
      console.error('Order error:', error)
      toast({
        title: 'Hata',
        description: 'Sipariş gönderilemedi. Lütfen tekrar deneyin.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Helper to convert hex to HSL
  const hexToHSL = (hex: string) => {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return null;
    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);
    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;
    if (max == min) {
      h = s = 0; // achromatic
    } else {
      let d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
    return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
  }

  const primaryHSL = organization.primary_color ? hexToHSL(organization.primary_color) : '142 76% 36%'; // Default emerald-600

  // Fetch reviews for specific product
  const [productReviews, setProductReviews] = useState<any[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(false)

  const fetchProductReviews = async (productId: string) => {
    setIsLoadingReviews(true)
    try {
      // 1. Find orders that contain this product
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('order_id')
        .eq('product_id', productId)

      if (itemsError) throw itemsError

      const orderIds = orderItems.map((item: { order_id: any }) => item.order_id)


      if (orderIds.length > 0) {
        // 2. Find reviews for these orders
        const { data: reviews, error: reviewsError } = await supabase
          .from('reviews')
          .select('*')
          .in('order_id', orderIds)
          .eq('is_published', true) // Only show published reviews
          .order('created_at', { ascending: false })
          .limit(10)

        if (reviewsError) throw reviewsError
        setProductReviews(reviews || [])
      } else {
        setProductReviews([])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setIsLoadingReviews(false)
    }
  }

  useEffect(() => {
    if (selectedItem) {
      fetchProductReviews(selectedItem.id)
    }
  }, [selectedItem])

  // Fetch product ratings for all products
  const fetchProductRatings = async () => {
    try {
      const productIds = allProducts.map(p => p.id)
      if (productIds.length === 0) return

      // Get all order items for these products
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_id, order_id')
        .in('product_id', productIds)

      if (itemsError) throw itemsError
      if (!orderItems || orderItems.length === 0) return

      // Get unique order IDs
      const orderIds = [...new Set(orderItems.map(item => item.order_id))]

      // Get reviews for these orders
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('order_id, rating')
        .in('order_id', orderIds)
        .eq('is_published', true)

      if (reviewsError) throw reviewsError
      if (!reviews || reviews.length === 0) return

      // Build a map of order_id -> product_id
      const orderToProduct: Record<string, string> = {}
      orderItems.forEach(item => {
        orderToProduct[item.order_id] = item.product_id
      })

      // Calculate ratings per product
      const ratingsMap: Record<string, { total: number; count: number }> = {}
      reviews.forEach(review => {
        const productId = orderToProduct[review.order_id]
        if (productId && review.rating) {
          if (!ratingsMap[productId]) {
            ratingsMap[productId] = { total: 0, count: 0 }
          }
          ratingsMap[productId].total += review.rating
          ratingsMap[productId].count += 1
        }
      })

      // Convert to average ratings
      const finalRatings: Record<string, { average: number; count: number }> = {}
      Object.keys(ratingsMap).forEach(productId => {
        const { total, count } = ratingsMap[productId]
        finalRatings[productId] = {
          average: total / count,
          count
        }
      })

      setProductRatings(finalRatings)
    } catch (error) {
      console.error('Error fetching product ratings:', error)
    }
  }

  // Fetch ratings on component mount
  useEffect(() => {
    fetchProductRatings()
  }, [allProducts])

  return (
    <>
      <style jsx global>{`
        :root {
          --primary: ${primaryHSL};
          --primary-foreground: 0 0% 100%;
        }
      `}</style>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur">
          <div className="container flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              {organization.logo_url && (
                <Image
                  src={organization.logo_url}
                  alt={organization.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
              <div>
                <h1 className="font-bold text-lg">{organization.name}</h1>
                {tableInfo && (
                  <p className="text-xs text-muted-foreground">Masa: {tableInfo.table_number}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Language Selector */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  disabled={isTranslating}
                  className="relative"
                >
                  <Languages className="h-5 w-5" />
                </Button>

                {showLanguageMenu && (
                  <div className="absolute right-0 top-12 w-48 bg-background border rounded-lg shadow-lg p-2 z-50">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setSelectedLanguage(lang.code)
                          translateMenu(lang.code)
                          setShowLanguageMenu(false)
                        }}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-accent flex items-center gap-2 ${selectedLanguage === lang.code ? 'bg-accent' : ''
                          }`}
                      >
                        <span className="text-lg">{lang.flag}</span>
                        <span className="text-sm">{lang.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dark Mode Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsDarkMode(!isDarkMode)}
                title={isDarkMode ? 'Aydınlık Mod' : 'Karanlık Mod'}
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {tableInfo && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/waiter-calls', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          organization_id: organization.id,
                          qr_code_id: tableInfo.id,
                          call_type: 'service',
                        }),
                      })
                      if (response.ok) {
                        toast({
                          title: 'Garson Çağrıldı',
                          description: 'Garsonunuz en kısa sürede gelecektir.',
                        })
                      }
                    } catch (error) {
                      toast({
                        title: 'Hata',
                        description: 'Çağrı gönderilemedi',
                        variant: 'destructive',
                      })
                    }
                  }}
                  className="relative"
                >
                  <Bell className="h-5 w-5" />
                </Button>
              )}

              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowCart(true)}
                className="relative"
              >
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* Search & Category Chips - REORDERED */}
        <div className="sticky top-16 z-30 border-b bg-background/60 backdrop-blur">
          <div className="container py-3 space-y-3">
            {/* Search Bar - NOW FIRST */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Ürün ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Sort Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>

                {showFilterMenu && (
                  <div className="absolute right-0 top-12 w-48 bg-background border rounded-lg shadow-lg p-2 z-50">
                    <button
                      onClick={() => { setSortBy('default'); setShowFilterMenu(false) }}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-accent ${sortBy === 'default' ? 'bg-accent' : ''}`}
                    >
                      Sıralama Yok
                    </button>
                    <button
                      onClick={() => { setSortBy('price-asc'); setShowFilterMenu(false) }}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-accent ${sortBy === 'price-asc' ? 'bg-accent' : ''}`}
                    >
                      Fiyat (Düşük-Yüksek)
                    </button>
                    <button
                      onClick={() => { setSortBy('price-desc'); setShowFilterMenu(false) }}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-accent ${sortBy === 'price-desc' ? 'bg-accent' : ''}`}
                    >
                      Fiyat (Yüksek-Düşük)
                    </button>
                    <button
                      onClick={() => { setSortBy('name'); setShowFilterMenu(false) }}
                      className={`w-full text-left px-3 py-2 rounded hover:bg-accent ${sortBy === 'name' ? 'bg-accent' : ''}`}
                    >
                      İsme Göre (A-Z)
                    </button>
                  </div>
                )}
              </div>

              {/* View Mode Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  const newMode = viewMode === 'grid' ? 'list' : 'grid'
                  setViewMode(newMode)
                  toast({
                    title: 'Görünüm değiştirildi',
                    description: newMode === 'grid' ? 'Kart görünümü' : 'Liste görünümü'
                  })
                }}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3x3 className="h-4 w-4" />}
              </Button>
            </div>

            {/* Category Chips - NOW BELOW SEARCH */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Button
                size="sm"
                variant={selectedCategories.length === 0 ? "default" : "outline"}
                onClick={() => setSelectedCategories([])}
                className="whitespace-nowrap"
              >
                Tümü
              </Button>
              {translatedCategories.map(category => (
                <Button
                  key={category.id}
                  size="sm"
                  variant={selectedCategories.includes(category.id) ? "default" : "outline"}
                  onClick={() => {
                    if (selectedCategories.includes(category.id)) {
                      setSelectedCategories(prev => prev.filter(id => id !== category.id))
                    } else {
                      setSelectedCategories(prev => [...prev, category.id])
                    }
                  }}
                  className="whitespace-nowrap"
                >
                  {category.name || category.name_tr || category.name_en || 'Kategori'}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <main className="container py-6">
          {/* Campaigns */}
          {campaigns.length > 0 && (
            <div className="mb-6 space-y-2">
              {campaigns.map(campaign => (
                <Card key={campaign.id} className="bg-primary/5 border-primary/20">
                  <CardContent className="py-4">
                    <h3 className="font-semibold">{campaign.title}</h3>
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                    )}
                    {campaign.discount_percentage && (
                      <span className="inline-block mt-2 px-2 py-1 bg-primary text-primary-foreground text-xs font-bold rounded">
                        %{campaign.discount_percentage} İndirim
                      </span>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Menu Categories */}
          <div className="space-y-8">
            {translatedCategories
              .filter(category => {
                // Filter by selected categories
                if (selectedCategories.length > 0) {
                  return selectedCategories.includes(category.id)
                }
                return true
              })
              .map(category => {
                // Filter items by search query
                let filteredItems = category.items.filter(item => {
                  if (!searchQuery) return true
                  const query = searchQuery.toLowerCase()
                  return (
                    item.name?.toLowerCase().includes(query) ||
                    item.name_tr?.toLowerCase().includes(query) ||
                    item.name_en?.toLowerCase().includes(query) ||
                    item.description?.toLowerCase().includes(query)
                  )
                })

                // Sort filtered items
                if (sortBy === 'price-asc') {
                  filteredItems = filteredItems.sort((a, b) => a.price - b.price)
                } else if (sortBy === 'price-desc') {
                  filteredItems = filteredItems.sort((a, b) => b.price - a.price)
                } else if (sortBy === 'name') {
                  filteredItems = filteredItems.sort((a, b) =>
                    (a.name || a.name_tr || '').localeCompare(b.name || b.name_tr || '')
                  )
                }

                // Only render category if it has items after filtering
                if (filteredItems.length === 0) return null

                return (
                  <section key={category.id}>
                    <h2 className="text-2xl font-bold mb-4">{category.name || category.name_tr || category.name_en || 'Kategori'}</h2>
                    <div className={viewMode === 'grid'
                      ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
                      : "space-y-3"
                    }>
                      {filteredItems.map(item => {
                        // Get real rating from fetched data
                        const ratingData = productRatings[item.id]
                        const rating = ratingData?.average || 0
                        const reviewCount = ratingData?.count || 0

                        return viewMode === 'grid' ? (
                          // GRID VIEW
                          <Card key={item.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition" onClick={() => setSelectedItem(item)}>
                            {item.image_url && (
                              <div className="relative h-48 w-full">
                                <Image src={item.image_url} alt={item.name || item.name_tr || item.name_en || 'Ürün'} fill className="object-cover" />
                              </div>
                            )}
                            <CardHeader className="pb-3">
                              <CardTitle className="text-lg line-clamp-1">{item.name || item.name_tr || item.name_en || 'Ürün Adı'}</CardTitle>
                              <div className="flex items-center gap-1 mt-1">
                                {reviewCount > 0 ? (
                                  <>
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                    ))}
                                    <span className="text-xs text-muted-foreground ml-1">({reviewCount})</span>
                                  </>
                                ) : (
                                  <span className="text-xs text-muted-foreground">Henüz yorum yok</span>
                                )}
                              </div>
                              {(item.description || item.description_tr || item.description_en) && (
                                <CardDescription className="line-clamp-2 mt-2">{item.description || item.description_tr || item.description_en}</CardDescription>
                              )}
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-bold text-primary">{formatCurrency(item.price)}</span>
                                <Button size="sm" onClick={(e) => { e.stopPropagation(); addToCart(item); }}>
                                  <Plus className="h-4 w-4 mr-1" /> Ekle
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          // LIST VIEW  
                          <Card key={item.id} className="overflow-hidden cursor-pointer hover:shadow-lg transition" onClick={() => setSelectedItem(item)}>
                            <div className="flex gap-4 p-4">
                              {item.image_url && (
                                <div className="relative h-24 w-24 rounded-lg overflow-hidden flex-shrink-0">
                                  <Image src={item.image_url} alt={item.name || item.name_tr || item.name_en || 'Ürün'} fill className="object-cover" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg line-clamp-1">{item.name || item.name_tr || item.name_en || 'Ürün Adı'}</h3>
                                <div className="flex items-center gap-1 mt-1">
                                  {reviewCount > 0 ? (
                                    <>
                                      {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`h-3 w-3 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                      ))}
                                      <span className="text-xs text-muted-foreground ml-1">({reviewCount})</span>
                                    </>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Henüz yorum yok</span>
                                  )}
                                </div>
                                {(item.description || item.description_tr || item.description_en) && (
                                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.description || item.description_tr || item.description_en}</p>
                                )}
                                <div className="flex items-center justify-between mt-3">
                                  <span className="text-xl font-bold text-primary">{formatCurrency(item.price)}</span>
                                  <Button size="sm" onClick={(e) => { e.stopPropagation(); addToCart(item); }}>
                                    <Plus className="h-4 w-4 mr-1" /> Ekle
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        )
                      })}

                    </div>
                  </section>
                )
              })}
          </div>
        </main>

        {/* Cart Dialog */}
        <Dialog open={showCart} onOpenChange={setShowCart}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Sepetim</DialogTitle>
              <DialogDescription>
                {itemCount} ürün - Toplam: {formatCurrency(totalAmount)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sepetiniz boş</p>
              ) : (
                <>
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 pb-3 border-b">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {formatCurrency(item.price)} x {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, -1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => removeFromCart(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <div className="space-y-4 pt-4">
                    {/* Coupon Code Input */}
                    <div>
                      <Label htmlFor="coupon-code">İndirim Kuponu (Opsiyonel)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="coupon-code"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          placeholder="Kupon kodunuz (örn: TEST25)"
                          disabled={!!appliedCoupon}
                        />
                        {!appliedCoupon ? (
                          <Button
                            onClick={applyCoupon}
                            disabled={isValidatingCoupon || !couponCode}
                            className="whitespace-nowrap"
                          >
                            {isValidatingCoupon ? 'Kontrol...' : 'Kullan'}
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setAppliedCoupon(null)
                              setDiscountAmount(0)
                              setCouponCode('')
                            }}
                            className="whitespace-nowrap"
                          >
                            Kaldır
                          </Button>
                        )}
                      </div>
                      {appliedCoupon && (
                        <p className="text-sm text-green-600 mt-1">
                          ✓ {appliedCoupon.code} kuponu uygulandı
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="customer-name">İsim (Opsiyonel)</Label>
                      <Input
                        id="customer-name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Adınız"
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-notes">Not (Opsiyonel)</Label>
                      <Textarea
                        id="customer-notes"
                        value={customerNotes}
                        onChange={(e) => setCustomerNotes(e.target.value)}
                        placeholder="Sipariş notunuz..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span>Ara Toplam:</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex items-center justify-between text-sm text-green-600">
                        <span>İndirim ({appliedCoupon?.code}):</span>
                        <span>-{formatCurrency(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between font-bold pt-2 border-t">
                      <span>Toplam:</span>
                      <span className="text-2xl">{formatCurrency(totalAmount)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={submitOrder}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Gönderiliyor...' : 'Siparişi Gönder'}
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* AI Assistant */}
        {showAI && (
          <>
            {/* Backdrop Blur */}
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setShowAI(false)}
            />
            <AIAssistantChat
              organization={organization}
              sessionId={sessionId}
              onClose={() => setShowAI(false)}
              onAddToCart={(item) => addToCart(item)}
              aiConfig={aiConfig}
              products={allProducts}
            />
          </>
        )}

        {/* Item Detail Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="[&>button]:hidden p-0 gap-0 max-w-2xl">
            {selectedItem && (
              <>
                {selectedItem.image_url && (
                  <div className="relative h-80 md:h-96 w-full">
                    <Image
                      src={selectedItem.image_url}
                      alt={selectedItem.name || selectedItem.name_tr || selectedItem.name_en || 'Ürün'}
                      fill
                      className="object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-4 top-4 z-50 bg-white/90 hover:bg-white rounded-full shadow-lg w-10 h-10"
                      onClick={() => setSelectedItem(null)}
                    >
                      <X className="h-5 w-5 text-gray-900" />
                    </Button>
                  </div>
                )}
                {!selectedItem.image_url && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-4 z-50 bg-white hover:bg-white/90 rounded-full shadow-lg w-10 h-10"
                    onClick={() => setSelectedItem(null)}
                  >
                    <X className="h-5 w-5 text-gray-900" />
                  </Button>
                )}
                <div className="p-6">
                  <DialogHeader>
                    <DialogTitle>{selectedItem.name || selectedItem.name_tr || selectedItem.name_en || 'Ürün Adı'}</DialogTitle>
                    <DialogDescription>{selectedItem.description || selectedItem.description_tr || selectedItem.description_en}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{formatCurrency(selectedItem.price)}</span>
                    </div>
                    {selectedItem.allergens.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Alerjenler:</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.allergens.map(allergen => (
                            <span key={allergen} className="px-2 py-1 bg-secondary text-xs rounded">
                              {allergen}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Reviews Section - Now with Toggle */}
                    <div className="mt-6 border-t pt-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          Yorumlar ({productReviews.length})
                        </h3>
                        {productReviews.length > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowReviewsPanel(true)}
                          >
                            Tüm Yorumları Gör
                          </Button>
                        )}
                      </div>

                      {isLoadingReviews ? (
                        <p className="text-sm text-center text-muted-foreground py-4">Yorumlar yükleniyor...</p>
                      ) : productReviews.length === 0 ? (
                        <p className="text-sm text-center text-muted-foreground py-4">Henüz yorum yok</p>
                      ) : (
                        <div className="space-y-3">
                          {/* Show only first 2 reviews as preview */}
                          {productReviews.slice(0, 2).map((review, idx) => (
                            <div key={idx} className="bg-muted/50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-sm">{review.customer_name || 'Anonim'}</span>
                                <span className="text-xs text-muted-foreground">
                                  {review.created_at ? new Date(review.created_at).toLocaleDateString('tr-TR') : ''}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 mb-2">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`h-3 w-3 ${i < (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                                ))}
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{review.comments}</p>
                              {review.restaurant_reply && (
                                <div className="mt-2 pl-4 border-l-2 border-primary/30">
                                  <p className="text-xs font-semibold text-primary mb-1">Restoran Yanıtı:</p>
                                  <p className="text-xs text-muted-foreground line-clamp-2">{review.restaurant_reply}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => {
                        addToCart(selectedItem)
                        setSelectedItem(null)
                      }}
                    >
                      Sepete Ekle
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* AI Assistant FAB */}
        {aiConfig && (
          <>
            <Button
              onClick={() => {
                setShowAI(!showAI)
                if (showAIWelcome) setShowAIWelcome(false)
              }}
              className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-40"
              size="icon"
            >
              <MessageSquare className="h-6 w-6" />
            </Button>

            {showAI && (
              <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-3rem)] z-50">
                {/* Placeholder for positioning if needed, but main chat is global */}
              </div>
            )}

            {showAIWelcome && !showAI && (
              <div className="fixed bottom-24 right-6 w-80 max-w-[calc(100vw-3rem)] bg-primary text-primary-foreground p-4 rounded-lg shadow-lg z-40 animate-in slide-in-from-right">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Merhaba! 👋</p>
                    <p className="text-xs mt-1 opacity-90">
                      Size yardımcı olabilirim. Menümüz hakkında sorularınız varsa benimle sohbet edebilirsiniz!
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setShowAIWelcome(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <footer className="border-t mt-12 bg-muted/30">
          <div className="container py-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Restaurant Info */}
              <div>
                <h3 className="font-semibold mb-3">{organization.name}</h3>
                {organization.description && (
                  <p className="text-sm text-muted-foreground mb-3">{organization.description}</p>
                )}
              </div>

              {/* Contact & Location */}
              <div className="space-y-2">
                <h3 className="font-semibold mb-3">İletişim</h3>
                {organization.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{organization.address}</span>
                  </div>
                )}
                {organization.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <a href={`tel:${organization.phone}`} className="text-muted-foreground hover:text-foreground">
                      {organization.phone}
                    </a>
                  </div>
                )}

              </div>

              {/* Wi-Fi Info */}
              {(organization.wifi_ssid || organization.wifi_password) && (
                <div className="space-y-2">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Wifi className="h-4 w-4" />
                    Wi-Fi Bilgileri
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-xl border space-y-3">
                    {organization.wifi_ssid && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Ağ Adı</span>
                        <span className="font-medium">{organization.wifi_ssid}</span>
                      </div>
                    )}
                    {organization.wifi_password && (
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-muted-foreground">Şifre</span>
                        <div className="flex items-center gap-2">
                          <code className="bg-background px-2 py-1 rounded border font-mono text-sm">
                            {organization.wifi_password}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => {
                              navigator.clipboard.writeText(organization.wifi_password!)
                              toast({
                                title: "Kopyalandı",
                                description: "Wi-Fi şifresi kopyalandı",
                              })
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t text-center text-sm text-muted-foreground">
              © {new Date().getFullYear()} {organization.name}. Tüm hakları saklıdır.
            </div>
          </div>
        </footer>

        {/* Reviews Sliding Panel */}
        <Dialog open={showReviewsPanel} onOpenChange={setShowReviewsPanel}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <DialogHeader className="px-6 pt-6 pb-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                Tüm Yorumlar ({reviewStarFilter ? productReviews.filter(r => r.rating === reviewStarFilter).length : productReviews.length})
              </DialogTitle>
              <DialogDescription>
                {selectedItem?.name || selectedItem?.name_tr || selectedItem?.name_en} ürünü hakkındaki müşteri yorumları
              </DialogDescription>

              {/* Star Filter */}
              <div className="flex gap-2 pt-3 flex-wrap">
                <Button
                  size="sm"
                  variant={reviewStarFilter === null ? "default" : "outline"}
                  onClick={() => setReviewStarFilter(null)}
                  className="text-xs"
                >
                  Tümü
                </Button>
                {[5, 4, 3, 2, 1].map(stars => (
                  <Button
                    key={stars}
                    size="sm"
                    variant={reviewStarFilter === stars ? "default" : "outline"}
                    onClick={() => setReviewStarFilter(stars)}
                    className="text-xs flex items-center gap-1"
                  >
                    {stars} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </Button>
                ))}
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              {isLoadingReviews ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Yorumlar yükleniyor...</p>
                </div>
              ) : productReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Star className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">Henüz yorum yapılmamış</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">İlk yorumu siz yapın!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {productReviews
                    .filter(review => reviewStarFilter === null || review.rating === reviewStarFilter)
                    .map((review, idx) => (
                      <div key={idx} className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-colors">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <span className="font-semibold text-base">{review.customer_name || 'Anonim Müşteri'}</span>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < (review.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                                />
                              ))}
                              <span className="text-sm text-muted-foreground ml-2">
                                {review.rating}/5
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {review.created_at ? new Date(review.created_at).toLocaleDateString('tr-TR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : ''}
                          </span>
                        </div>

                        {review.comments && (
                          <p className="text-sm text-foreground/90 mt-3 leading-relaxed">
                            {review.comments}
                          </p>
                        )}

                        {review.restaurant_reply && (
                          <div className="mt-4 pl-4 border-l-2 border-primary bg-primary/5 py-2 pr-2 rounded-r">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                <span className="text-xs text-primary-foreground font-bold">R</span>
                              </div>
                              <span className="text-xs font-semibold text-primary">Restoran Yanıtı</span>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {review.restaurant_reply}
                            </p>
                            {review.reply_date && (
                              <span className="text-xs text-muted-foreground/70 mt-1 block">
                                {new Date(review.reply_date).toLocaleDateString('tr-TR')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t bg-muted/20">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowReviewsPanel(false)}
              >
                Kapat
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}
