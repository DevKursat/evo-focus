'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Star, MessageSquare, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

export default function ReviewsPage({ params }: { params: { slug: string } }) {
    const [reviews, setReviews] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [replyingTo, setReplyingTo] = useState<string | null>(null)
    const [replyText, setReplyText] = useState('')
    const [reportingTo, setReportingTo] = useState<string | null>(null)
    const [reportReason, setReportReason] = useState('')
    const { toast } = useToast()
    // const supabase = createClient() - Removed, using imported instance

    const fetchReviews = useCallback(async () => {
        // First get restaurant ID from slug (assuming slug is passed or we get it from context)
        // For now, we'll fetch the restaurant by slug if needed, or just use the current user's restaurant
        // Simplified: Fetch reviews for the restaurant the user manages

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: adminData } = await supabase
            .from('restaurant_admins')
            .select('restaurant_id')
            .eq('profile_id', user.id)
            .single()

        if (!adminData) return

        const { data, error } = await supabase
            .from('reviews')
            .select('*, orders(order_number)')
            .eq('restaurant_id', adminData.restaurant_id)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching reviews:', error)
        } else {
            setReviews(data || [])
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        fetchReviews()
    }, [fetchReviews])

    const handleReply = async (reviewId: string) => {
        if (!replyText.trim()) return

        try {
            const { error } = await supabase
                .from('reviews')
                .update({
                    reply: replyText,
                    reply_at: new Date().toISOString()
                })
                .eq('id', reviewId)

            if (error) throw error

            toast({ title: 'Başarılı', description: 'Yanıtınız gönderildi.' })
            setReplyingTo(null)
            setReplyText('')
            fetchReviews()
        } catch (error) {
            toast({ title: 'Hata', description: 'Yanıt gönderilemedi.', variant: 'destructive' })
        }
    }

    const handleReport = async () => {
        if (!reportingTo || !reportReason.trim()) return

        // Find the review to get restaurant_id
        const review = reviews.find(r => r.id === reportingTo)
        if (!review) return

        try {
            const { error } = await supabase
                .from('review_complaints')
                .insert({
                    review_id: reportingTo,
                    restaurant_id: review.restaurant_id,
                    reason: reportReason,
                    status: 'pending'
                })

            if (error) throw error

            toast({ title: 'Şikayet Edildi', description: 'Şikayetiniz admin onayına gönderildi.' })
            setReportingTo(null)
            setReportReason('')
        } catch (error) {
            toast({ title: 'Hata', description: 'Şikayet oluşturulamadı.', variant: 'destructive' })
        }
    }

    if (loading) return <div>Yükleniyor...</div>

    return (
        <div className="container py-6 space-y-6">
            <h1 className="text-2xl font-bold">Değerlendirmeler</h1>

            <div className="grid gap-4">
                {reviews.map((review) => (
                    <Card key={review.id}>
                        <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                            <div className="space-y-1">
                                <CardTitle className="text-base font-medium">
                                    Sipariş #{review.orders?.order_number}
                                </CardTitle>
                                <div className="flex items-center gap-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {new Date(review.created_at).toLocaleDateString('tr-TR')}
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm">{review.comment}</p>

                            {/* Existing Reply */}
                            {review.reply && (
                                <div className="bg-muted p-3 rounded-lg text-sm">
                                    <div className="font-semibold mb-1 flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        Restoran Yanıtı
                                    </div>
                                    {review.reply}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                {!review.reply && (
                                    <Button variant="outline" size="sm" onClick={() => setReplyingTo(review.id)}>
                                        <MessageSquare className="h-4 w-4 mr-2" /> Yanıtla
                                    </Button>
                                )}
                                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setReportingTo(review.id)}>
                                    <AlertTriangle className="h-4 w-4 mr-2" /> Şikayet Et
                                </Button>
                            </div>

                            {/* Reply Input */}
                            {replyingTo === review.id && (
                                <div className="space-y-2 mt-4">
                                    <Textarea
                                        placeholder="Yanıtınız..."
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                    />
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>İptal</Button>
                                        <Button size="sm" onClick={() => handleReply(review.id)}>Gönder</Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Report Dialog */}
            <Dialog open={!!reportingTo} onOpenChange={(open) => !open && setReportingTo(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Yorumu Şikayet Et</DialogTitle>
                        <DialogDescription>
                            Bu yorumu neden şikayet ediyorsunuz? Platform admini inceleyecektir.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Şikayet Nedeni</Label>
                            <Textarea
                                placeholder="Örn: Hakaret, spam, yanlış bilgi..."
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setReportingTo(null)}>İptal</Button>
                        <Button variant="destructive" onClick={handleReport}>Şikayet Et</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
