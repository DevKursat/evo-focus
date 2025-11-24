'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Bell, Check, X } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface WaiterCall {
    id: string
    restaurant_id: string
    qr_code_id: string
    table_number: string
    call_type: string
    status: 'pending' | 'acknowledged' | 'completed' | 'cancelled'
    created_at: string
    acknowledged_at: string | null
    completed_at: string | null
}

interface Props {
    restaurantId: string
}

export default function WaiterCallsDashboard({ restaurantId }: Props) {
    const [calls, setCalls] = useState<WaiterCall[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        fetchCalls()

        // Real-time subscription
        const channel = supabase
            .channel('waiter-calls-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'waiter_calls',
                    filter: `restaurant_id=eq.${restaurantId}`
                },
                (payload) => {
                    console.log('Waiter call change:', payload)
                    fetchCalls()
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [restaurantId])

    const fetchCalls = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('waiter_calls')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setCalls(data || [])
        } catch (error: any) {
            console.error('Error fetching calls:', error)
            toast({
                variant: 'destructive',
                title: 'Hata',
                description: 'Çağrılar yüklenemedi'
            })
        } finally {
            setLoading(false)
        }
    }

    const updateCallStatus = async (callId: string, status: 'acknowledged' | 'completed' | 'cancelled') => {
        try {
            const response = await fetch('/api/waiter-calls', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: callId, status })
            })

            if (!response.ok) throw new Error('Failed to update')

            toast({
                title: 'Başarılı',
                description: status === 'acknowledged' ? 'Çağrı kabul edildi' :
                    status === 'completed' ? 'Çağrı tamamlandı' : 'Çağrı iptal edildi'
            })

            fetchCalls()
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Hata',
                description: 'Durum güncellenemedi'
            })
        }
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-500',
            acknowledged: 'bg-blue-500',
            completed: 'bg-green-500',
            cancelled: 'bg-gray-500'
        }
        return styles[status as keyof typeof styles] || 'bg-gray-500'
    }

    const pendingCalls = calls.filter(c => c.status === 'pending')
    const activeCalls = calls.filter(c => c.status === 'acknowledged')
    const completedCalls = calls.filter(c => ['completed', 'cancelled'].includes(c.status))

    if (loading) {
        return <div className="p-8 text-center">Yükleniyor...</div>
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Bekleyen</CardTitle>
                        <div className="text-3xl font-bold">{pendingCalls.length}</div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Aktif</CardTitle>
                        <div className="text-3xl font-bold">{activeCalls.length}</div>
                    </CardHeader>
                </Card>
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Tamamlanan</CardTitle>
                        <div className="text-3xl font-bold  text-green-600">{completedCalls.length}</div>
                    </CardHeader>
                </Card>
            </div>

            <div className="space-y-4">
                <h2 className="text-2xl font-bold">Garson Çağrıları</h2>

                {calls.length === 0 ? (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            Henüz çağrı yok
                        </CardContent>
                    </Card>
                ) : (
                    calls.map((call) => (
                        <Card key={call.id} className={call.status === 'pending' ? 'border-yellow-500 border-2' : ''}>
                            <CardContent className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-3">
                                            <Bell className="h-5 w-5" />
                                            <h3 className="text-xl font-bold">Masa  {call.table_number}</h3>
                                            <Badge className={getStatusBadge(call.status)}>
                                                {call.status === 'pending' ? 'Bekliyor' :
                                                    call.status === 'acknowledged' ? 'Kabul Edildi' :
                                                        call.status === 'completed' ? 'Tamamlandı' : 'İptal'}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {formatDistanceToNow(new Date(call.created_at), { addSuffix: true, locale: tr })}
                                        </p>
                                    </div>

                                    {call.status === 'pending' && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="default"
                                                onClick={() => updateCallStatus(call.id, 'acknowledged')}
                                            >
                                                <Check className="h-4 w-4 mr-1" />
                                                Kabul Et
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => updateCallStatus(call.id, 'cancelled')}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}

                                    {call.status === 'acknowledged' && (
                                        <Button
                                            size="sm"
                                            variant="default"
                                            onClick={() => updateCallStatus(call.id, 'completed')}
                                        >
                                            <Check className="h-4 w-4 mr-1" />
                                            Tamamla
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
