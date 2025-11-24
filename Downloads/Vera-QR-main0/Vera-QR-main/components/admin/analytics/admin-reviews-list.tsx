'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, X, AlertTriangle, Loader2 } from 'lucide-react'
import { updateReviewStatus } from '@/app/admin/analytics/actions'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export default function AdminReviewsList() {
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchReviews = async () => {
    setLoading(true)
    // Fetch reported reviews that are pending resolution
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        restaurant:restaurants(name)
      `)
      .eq('is_reported', true)
      .eq('admin_resolution', 'pending')
      .order('created_at', { ascending: false })

    if (data) setReviews(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleAction = async (reviewId: string, action: 'approve' | 'reject') => {
    setProcessingId(reviewId)
    const res = await updateReviewStatus(reviewId, action)
    setProcessingId(null)

    if (res.error) {
      toast({ title: 'Hata', description: res.error, variant: 'destructive' })
    } else {
      toast({
        title: 'İşlem Başarılı',
        description: action === 'approve' ? 'Şikayet onaylandı, yorum kaldırıldı.' : 'Şikayet reddedildi.'
      })
      // Refresh list
      fetchReviews()
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-slate-400" /></div>
  }

  if (reviews.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-slate-500">
          <Check className="h-12 w-12 mx-auto mb-4 text-green-500" />
          <p>Bekleyen şikayet yok. Harika!</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review.id} className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
                <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        {review.restaurant?.name}
                        <Badge variant="outline" className="font-normal">
                            {format(new Date(review.created_at), 'd MMM yyyy', { locale: tr })}
                        </Badge>
                    </CardTitle>
                    <div className="text-sm text-slate-500 mt-1">
                        Müşteri: {review.customer_name || 'Anonim'} | Puan: {review.rating}/5
                    </div>
                </div>
                <Badge variant="destructive" className="flex gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Şikayet Edildi
                </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-md mb-3 italic">
                &quot;{review.comment}&quot;
            </div>

            <div className="mb-4">
                <span className="text-sm font-semibold text-red-500">Şikayet Nedeni:</span>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                    {review.report_reason || 'Belirtilmemiş'}
                </p>
            </div>

            <div className="flex gap-2 justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction(review.id, 'reject')}
                    disabled={!!processingId}
                >
                    {processingId === review.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                    Şikayeti Reddet
                </Button>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleAction(review.id, 'approve')}
                    disabled={!!processingId}
                >
                    {processingId === review.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                    Şikayeti Onayla (Sil)
                </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
