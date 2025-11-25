'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle2, Clock, ChefHat, Utensils, Star, ArrowLeft } from 'lucide-react'
import FoodCatcherGame from '@/components/customer/food-catcher-game'
import confetti from 'canvas-confetti'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

type OrderStatus = 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'paid'

const STATUS_STEPS = [
    { id: 'pending', label: 'Sipariş Alındı', icon: Clock, progress: 10 },
    { id: 'preparing', label: 'Hazırlanıyor', icon: ChefHat, progress: 40 },
    { id: 'ready', label: 'Servise Hazır', icon: Utensils, progress: 75 },
    { id: 'served', label: 'Afiyet Olsun!', icon: CheckCircle2, progress: 100 },
]

export default function OrderTrackingPage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [showConfetti, setShowConfetti] = useState(false)
    const [showReviewDialog, setShowReviewDialog] = useState(false)
    const [countdown, setCountdown] = useState<number | null>(null)

    // Review state
    const [rating, setRating] = useState(5)
    const [comment, setComment] = useState('')
    const [isSubmittingReview, setIsSubmittingReview] = useState(false)

    const triggerCelebration = useCallback(() => {
        setShowConfetti(true)
        const duration = 3000
        const end = Date.now() + duration

        const frame = () => {
            confetti({
                particleCount: 2,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#FFD700', '#FFA500', '#FF4500']
            })
            confetti({
                particleCount: 2,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#00FF00', '#00BFFF', '#FF00FF']
            })

            if (Date.now() < end) {
                requestAnimationFrame(frame)
            } else {
                setShowReviewDialog(true)
            }
        }
        frame()
    }, [])

    const startCountdown = useCallback(() => {
        setCountdown(10)
        const interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev === 1) {
                    clearInterval(interval)
                    triggerCelebration()
                    return null
                }
                return prev ? prev - 1 : null
            })
        }, 1000)
    }, [triggerCelebration])

    useEffect(() => {
        const fetchOrder = async () => {
            if (!params.orderId) return

            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(*)')
                .eq('id', params.orderId)
                .single()

            if (error) {
                console.error('Error fetching order:', error)
                toast({ title: 'Hata', description: 'Sipariş bulunamadı', variant: 'destructive' })
                return
            }

            setOrder(data)
            setLoading(false)

            // Initial check for served status
            if (data.status === 'served') {
                triggerCelebration()
            }
        }

        fetchOrder()

        // Real-time subscription
        const channel = supabase
            .channel('order_status')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'orders',
                    filter: `id=eq.${params.orderId}`,
                },
                (payload) => {
                    setOrder((prev: any) => ({ ...prev, ...payload.new }))

                    if (payload.new.status === 'served' && payload.old.status !== 'served') {
                        startCountdown()
                    }
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [params.orderId, startCountdown, triggerCelebration, toast])

    const submitReview = async () => {
        if (!order) return
        setIsSubmittingReview(true)
        try {
            const { error } = await supabase
                .from('reviews')
                .insert({
                    restaurant_id: order.restaurant_id,
                    order_id: order.id,
                    rating,
                    comment,
                    is_published: true
                })

            if (error) throw error

            toast({ title: 'Teşekkürler!', description: 'Yorumunuz alındı.' })
            setShowReviewDialog(false)
        } catch (error) {
            toast({ title: 'Hata', description: 'Yorum gönderilemedi', variant: 'destructive' })
        } finally {
            setIsSubmittingReview(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status)
    const currentProgress = currentStepIndex >= 0 ? STATUS_STEPS[currentStepIndex].progress : 0

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Countdown Overlay */}
            {countdown !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="text-center animate-bounce">
                        <div className="text-9xl font-bold text-white mb-4">{countdown}</div>
                        <div className="text-2xl text-white/80">Yemeğiniz Geliyor!</div>
                    </div>
                </div>
            )}

            <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur p-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <h1 className="font-bold text-lg">Sipariş Takibi</h1>
            </header>

            <main className="container py-6 space-y-6">
                {/* Status Card */}
                <Card className="border-primary/20 shadow-lg">
                    <CardHeader>
                        <CardTitle className="flex justify-between items-center">
                            <span>Sipariş #{order.order_number}</span>
                            <span className="text-sm font-normal text-muted-foreground">
                                {new Date(order.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium">
                                <span>Durum</span>
                                <span className="text-primary capitalize">
                                    {STATUS_STEPS.find(s => s.id === order.status)?.label || order.status}
                                </span>
                            </div>
                            <Progress value={currentProgress} className="h-2" />
                        </div>

                        <div className="grid grid-cols-4 gap-2 text-center text-xs">
                            {STATUS_STEPS.map((step, index) => {
                                const Icon = step.icon
                                const isActive = index <= currentStepIndex
                                return (
                                    <div key={step.id} className={`flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                                        <div className={`p-2 rounded-full ${isActive ? 'bg-primary/10' : 'bg-muted'}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <span className="hidden sm:inline">{step.label}</span>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Mini Game */}
                {order.status !== 'served' && order.status !== 'cancelled' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold">Beklerken Eğlenin!</h2>
                            <span className="text-xs text-muted-foreground">Yemeğiniz hazırlanırken oynayın</span>
                        </div>
                        <FoodCatcherGame />
                    </div>
                )}

                {/* Order Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Sipariş Detayı</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {order.order_items.map((item: any) => (
                                <div key={item.id} className="flex justify-between items-center border-b last:border-0 pb-2 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-muted h-8 w-8 rounded flex items-center justify-center text-xs font-bold">
                                            {item.quantity}x
                                        </div>
                                        <span>{item.product_name}</span>
                                    </div>
                                    <span className="font-medium">{item.product_price * item.quantity} ₺</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-4 font-bold text-lg">
                                <span>Toplam</span>
                                <span>{order.total_amount} ₺</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Review Dialog */}
            <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Afiyet Olsun! 🎉</DialogTitle>
                        <DialogDescription>
                            Yemeğinizi beğendiniz mi? Deneyiminizi puanlayın.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex justify-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    onClick={() => setRating(star)}
                                    className={`text-3xl transition-transform hover:scale-110 ${rating >= star ? 'text-yellow-500' : 'text-gray-300'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <Label>Yorumunuz</Label>
                            <Textarea
                                placeholder="Lezzet, servis ve ortam nasıldı?"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setShowReviewDialog(false)}>Daha Sonra</Button>
                        <Button onClick={submitReview} disabled={isSubmittingReview}>
                            {isSubmittingReview ? 'Gönderiliyor...' : 'Gönder'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
