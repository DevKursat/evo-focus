'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Star, MessageSquare, Trash2, ThumbsUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

interface Review {
  id: string
  customer_name: string
  rating: number
  comment: string
  order_id: string | null
  admin_response: string | null
  created_at: string
  responded_at: string | null
}

interface Props {
  restaurantId: string
}

export default function ReviewsManagement({ restaurantId }: Props) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedReview, setSelectedReview] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [isResponding, setIsResponding] = useState(false)
  const { toast } = useToast()

  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setReviews(data || [])
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast({
        title: 'Hata',
        description: 'Yorumlar yüklenemedi',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }, [restaurantId, toast])

  useEffect(() => {
    fetchReviews()

    // Subscribe to real-time updates
    const channel = supabase
      .channel('reviews-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        () => {
          fetchReviews()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, fetchReviews])

  const handleResponse = async (reviewId: string) => {
    if (!responseText.trim()) {
      toast({
        title: 'Uyarı',
        description: 'Lütfen bir yanıt yazın',
        variant: 'destructive',
      })
      return
    }

    setIsResponding(true)
    try {
      const { error } = await (supabase
        .from('reviews') as any)
        .update({
          admin_response: responseText,
          responded_at: new Date().toISOString(),
        })
        .eq('id', reviewId)

      if (error) throw error

      toast({
        title: 'Başarılı',
        description: 'Yanıtınız gönderildi',
      })

      setSelectedReview(null)
      setResponseText('')
      fetchReviews()
    } catch (error) {
      console.error('Error responding:', error)
      toast({
        title: 'Hata',
        description: 'Yanıt gönderilemedi',
        variant: 'destructive',
      })
    } finally {
      setIsResponding(false)
    }
  }

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Bu yorumu silmek istediğinize emin misiniz?')) return

    try {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (error) throw error

      toast({
        title: 'Başarılı',
        description: 'Yorum silindi',
      })

      fetchReviews()
    } catch (error) {
      console.error('Error deleting review:', error)
      toast({
        title: 'Hata',
        description: 'Yorum silinemedi',
        variant: 'destructive',
      })
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getAverageRating = () => {
    if (reviews.length === 0) return 0
    const sum = reviews.reduce((acc, review) => acc + review.rating, 0)
    return (sum / reviews.length).toFixed(1)
  }

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((review) => {
      distribution[review.rating as keyof typeof distribution]++
    })
    return distribution
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Yorumlar yükleniyor...</p>
      </div>
    )
  }

  const avgRating = getAverageRating()
  const distribution = getRatingDistribution()

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ortalama Puan</CardDescription>
            <CardTitle className="text-3xl">{avgRating}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderStars(Math.round(parseFloat(avgRating as string)))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Toplam Yorum</CardDescription>
            <CardTitle className="text-3xl">{reviews.length}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Yanıtlanan</CardDescription>
            <CardTitle className="text-3xl">
              {reviews.filter((r) => r.admin_response).length}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Bekleyen</CardDescription>
            <CardTitle className="text-3xl">
              {reviews.filter((r) => !r.admin_response).length}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Puan Dağılımı</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = distribution[rating as keyof typeof distribution]
              const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-400 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12 text-right">
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Henüz yorum yok</p>
            </CardContent>
          </Card>
        ) : (
          reviews.map((review) => (
            <Card key={review.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold">{review.customer_name}</span>
                      {renderStars(review.rating)}
                      {!review.admin_response && (
                        <Badge variant="secondary">Yanıt Bekliyor</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(review.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{review.comment}</p>

                {review.admin_response ? (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <ThumbsUp className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-semibold text-blue-900">
                        İşletme Yanıtı
                      </span>
                    </div>
                    <p className="text-sm text-blue-900">{review.admin_response}</p>
                    <p className="text-xs text-blue-700 mt-2">
                      {formatDistanceToNow(new Date(review.responded_at!), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                  </div>
                ) : selectedReview === review.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Yanıtınızı yazın..."
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleResponse(review.id)}
                        disabled={isResponding}
                      >
                        Yanıtla
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedReview(null)
                          setResponseText('')
                        }}
                      >
                        İptal
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedReview(review.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Yanıtla
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
