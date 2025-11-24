'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Gift, TrendingUp, Users, Plus, Coins } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { formatCurrency } from '@/lib/utils'

interface LoyaltyPoint {
  id: string
  customer_name: string
  customer_phone: string
  total_points: number
  lifetime_points: number
  created_at: string
}

interface LoyaltyTransaction {
  id: string
  points: number
  transaction_type: 'earned' | 'redeemed'
  order_id: string | null
  description: string
  created_at: string
  customer: {
    customer_name: string
  }
}

interface Props {
  restaurantId: string
}

export default function LoyaltyManagement({ restaurantId }: Props) {
  const [customers, setCustomers] = useState<LoyaltyPoint[]>([])
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddPoints, setShowAddPoints] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState('')
  const [pointsToAdd, setPointsToAdd] = useState('')
  const [description, setDescription] = useState('')
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      // Fetch customers with loyalty points
      const { data: customersData, error: customersError } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('total_points', { ascending: false })

      if (customersError) throw customersError
      setCustomers(customersData || [])

      // Fetch recent transactions
      const { data: transactionsData, error: transactionsError } = await (supabase
        .from('loyalty_transactions')
        .select(`
          id,
          points,
          transaction_type,
          order_id,
          description,
          created_at,
          loyalty_points!inner(customer_name, restaurant_id)
        `)
        .eq('loyalty_points.restaurant_id', restaurantId)
        .order('created_at', { ascending: false })
        .limit(50) as any)

      if (transactionsError) throw transactionsError
      
      // Transform data
      const formatted = transactionsData?.map((t: any) => ({
        ...t,
        customer: {
          customer_name: (t.loyalty_points as any).customer_name
        }
      })) || []
      
      setTransactions(formatted)
    } catch (error) {
      console.error('Error fetching loyalty data:', error)
      toast({
        title: 'Hata',
        description: 'Sadakat verileri yüklenemedi',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId, toast])

  useEffect(() => {
    fetchData()
  }, [restaurantId, fetchData])

  const handleAddPoints = async () => {
    if (!selectedCustomer || !pointsToAdd) {
      toast({
        title: 'Uyarı',
        description: 'Lütfen müşteri ve puan miktarı seçin',
        variant: 'destructive',
      })
      return
    }

    try {
      const points = parseInt(pointsToAdd)
      
      // Update customer points
      const { error: updateError } = await (supabase
        .from('loyalty_points') as any)
        .update({
          total_points: (supabase as any).rpc('increment', { x: points }),
          lifetime_points: (supabase as any).rpc('increment', { x: points }),
        })
        .eq('id', selectedCustomer)

      if (updateError) throw updateError

      // Add transaction
      const { error: transactionError } = await (supabase
        .from('loyalty_transactions') as any)
        .insert({
          loyalty_points_id: selectedCustomer,
          points,
          transaction_type: 'earned',
          description: description || 'Manuel puan ekleme',
        })

      if (transactionError) throw transactionError

      toast({
        title: 'Başarılı',
        description: `${points} puan eklendi`,
      })

      setShowAddPoints(false)
      setSelectedCustomer('')
      setPointsToAdd('')
      setDescription('')
      fetchData()
    } catch (error) {
      console.error('Error adding points:', error)
      toast({
        title: 'Hata',
        description: 'Puan eklenemedi',
        variant: 'destructive',
      })
    }
  }

  const getTotalStats = () => {
    const totalCustomers = customers.length
    const totalPoints = customers.reduce((sum, c) => sum + c.total_points, 0)
    const avgPoints = totalCustomers > 0 ? Math.round(totalPoints / totalCustomers) : 0
    const activeCustomers = customers.filter(c => c.total_points > 0).length

    return { totalCustomers, totalPoints, avgPoints, activeCustomers }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    )
  }

  const stats = getTotalStats()

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Toplam Müşteri
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalCustomers}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Aktif Müşteri
            </CardDescription>
            <CardTitle className="text-3xl">{stats.activeCustomers}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              Toplam Puan
            </CardDescription>
            <CardTitle className="text-3xl">{stats.totalPoints}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Ortalama Puan
            </CardDescription>
            <CardTitle className="text-3xl">{stats.avgPoints}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Müşteri Sadakat Programı</CardTitle>
              <CardDescription>
                Müşteri puanlarını yönetin ve ödüllendirin
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddPoints(!showAddPoints)}>
              <Plus className="h-4 w-4 mr-2" />
              Puan Ekle
            </Button>
          </div>
        </CardHeader>
        {showAddPoints && (
          <CardContent className="border-t pt-6">
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label>Müşteri Seç</Label>
                <select
                  className="w-full px-3 py-2 border rounded-md"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">Müşteri seçin...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customer_name} ({customer.total_points} puan)
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Puan Miktarı</Label>
                <Input
                  type="number"
                  value={pointsToAdd}
                  onChange={(e) => setPointsToAdd(e.target.value)}
                  placeholder="Örn: 100"
                />
              </div>

              <div className="space-y-2">
                <Label>Açıklama (Opsiyonel)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Örn: Doğum günü hediyesi"
                />
              </div>

              <div className="flex gap-2">
                <Button onClick={handleAddPoints}>Ekle</Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddPoints(false)
                    setSelectedCustomer('')
                    setPointsToAdd('')
                    setDescription('')
                  }}
                >
                  İptal
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Top Customers */}
      <Card>
        <CardHeader>
          <CardTitle>En Sadık Müşteriler</CardTitle>
          <CardDescription>Toplam puana göre sıralama</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {customers.slice(0, 10).map((customer, index) => (
              <div
                key={customer.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-semibold">{customer.customer_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.customer_phone}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    {customer.total_points}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Toplam: {customer.lifetime_points}
                  </p>
                </div>
              </div>
            ))}

            {customers.length === 0 && (
              <div className="text-center py-12">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Henüz sadakat programına katılmış müşteri yok
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Son İşlemler</CardTitle>
          <CardDescription>Puan kazanma ve kullanma geçmişi</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div>
                  <p className="font-semibold">{transaction.customer.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(transaction.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      transaction.transaction_type === 'earned'
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {transaction.transaction_type === 'earned' ? '+' : '-'}
                    {transaction.points} puan
                  </Badge>
                </div>
              </div>
            ))}

            {transactions.length === 0 && (
              <div className="text-center py-12">
                <Coins className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Henüz işlem yok</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
