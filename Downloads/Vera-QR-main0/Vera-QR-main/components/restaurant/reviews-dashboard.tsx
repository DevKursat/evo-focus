'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Star, MessageSquare, Flag, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface Review {
    id: string
    restaurant_id: string
    order_id: string
    rating: number
    comment: string | null
    customer_name?: string
    created_at: string
    reply: string | null
    reply_at: string | null
    complaint_reason: string | null
    complaint_status: 'pending' | 'resolved' | 'dismissed' | null
}

interface Props {
    restaurantId: string
}

export default function ReviewsDashboard({ restaurantId }: Props) {
    const [reviews, setReviews] = useState<Review[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    // Reply State
    const [replyDialogOpen, setReplyDialogOpen] = useState(false)
    const [selectedReview, setSelectedReview] = useState<Review | null>(null)
    const [replyText, setReplyText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Report/Complaint State
    const [reportDialogOpen, setReportDialogOpen] = useState(false)
    const [reportReason, setReportReason] = useState('')

    useEffect(() => {
        fetchReviews()
    }, [restaurantId])

    const fetchReviews = async () => {
        setLoading(true)
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
                variant: 'destructive',
                title: 'Hata',
                description: 'Yorumlar yüklenemedi'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleReplyClick = (review: Review) => {
        setSelectedReview(review)
        setReplyText(review.reply || '')
        setReplyDialogOpen(true)
    }

    const handleReportClick = (review: Review) => {
        setSelectedReview(review)
        setReportReason('')
        setReportDialogOpen(true)
    }

    const submitReply = async () => {
        if (!selectedReview) return
        setIsSubmitting(true)

        try {
            const { error } = await supabase
                .from('reviews')
                .update({
                    reply: replyText,
                    reply_at: new Date().toISOString()
                })
                .eq('id', selectedReview.id)

            if (error) throw error

            toast({
                title: 'Başarılı',
                description: 'Yanıtınız kaydedildi.'
            })
            setReplyDialogOpen(false)
            fetchReviews()
        } catch (error) {
            console.error('Error submitting reply:', error)
            toast({
                variant: 'destructive',
                title: 'Hata',
                description: 'Yanıt gönderilemedi.'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const submitReport = async () => {
        if (!selectedReview || !reportReason) return
        setIsSubmitting(true)

        try {
            const { error } = await supabase
                .from('reviews')
                .update({
                    complaint_reason: reportReason,
                    complaint_status: 'pending',
                    complaint_at: new Date().toISOString()
                })
                .eq('id', selectedReview.id)

            if (error) throw error

            toast({
                title: 'Bildirildi',
                description: 'Şikayetiniz admin onayına gönderildi.'
            })
            setReportDialogOpen(false)
            fetchReviews()
        } catch (error) {
            console.error('Error submitting report:', error)
            toast({
                variant: 'destructive',
                title: 'Hata',
                description: 'Şikayet gönderilemedi.'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return <div className="text-center p-8">Yükleniyor...</div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Müşteri Yorumları</h2>
                <Badge variant="outline" className="text-lg">
                    Ortalama: {(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)} / 5
                </Badge>
            </div>

            <div className="grid gap-4">
                {reviews.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            Henüz yorum yapılmamış.
                        </CardContent>
                    </Card>
                ) : (
                    reviews.map((review) => (
                        <Card key={review.id} className="relative">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                                />
                                            ))}
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: tr })}
                                        </span>
                                    </div>
                                    <div className="flex gap-2">
                                        {review.complaint_status === 'pending' && (
                                            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                                <AlertTriangle className="w-3 h-3 mr-1" /> İnceleniyor
                                            </Badge>
                                        )}
                                        {review.complaint_status === 'resolved' && (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Çözüldü
                                            </Badge>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => handleReportClick(review)} title="Admin'e Bildir">
                                            <Flag className="w-4 h-4 text-gray-400 hover:text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <p className="text-base">{review.comment}</p>

                                {review.reply && (
                                    <div className="bg-muted p-3 rounded-lg ml-4 border-l-4 border-primary">
                                        <p className="text-sm font-semibold text-primary mb-1">Restoran Yanıtı:</p>
                                        <p className="text-sm text-muted-foreground">{review.reply}</p>
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <Button variant="outline" size="sm" onClick={() => handleReplyClick(review)}>
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        {review.reply ? 'Yanıtı Düzenle' : 'Yanıtla'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Reply Dialog */}
            <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yoruma Yanıt Ver</DialogTitle>
                        <DialogDescription>
                            Müşterinize nazik bir dille yanıt verin.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Yanıtınız..."
                            rows={4}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>İptal</Button>
                        <Button onClick={submitReply} disabled={isSubmitting}>
                            {isSubmitting ? 'Kaydediliyor...' : 'Yanıtı Gönder'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Report Dialog */}
            <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yorumu Şikayet Et</DialogTitle>
                        <DialogDescription>
                            Bu yorumu neden Admin'e bildirmek istiyorsunuz?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Select onValueChange={setReportReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Şikayet Nedeni Seçin" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="spam">Spam / Reklam</SelectItem>
                                <SelectItem value="insult">Hakaret / Küfür</SelectItem>
                                <SelectItem value="fake">Gerçek Dışı / Yanıltıcı</SelectItem>
                                <SelectItem value="other">Diğer</SelectItem>
                            </SelectContent>
                        </Select>
                        {reportReason === 'other' && (
                            <Textarea
                                placeholder="Detaylı açıklama..."
                                onChange={(e) => setReportReason(e.target.value)} // Simple override for 'other' logic for now
                            />
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setReportDialogOpen(false)}>İptal</Button>
                        <Button onClick={submitReport} disabled={isSubmitting || !reportReason} variant="destructive">
                            {isSubmitting ? 'Gönderiliyor...' : 'Şikayet Et'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
