'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Bell, Check, X, Clock, CheckCircle2 } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface WaiterCall {
    id: string
    restaurant_id: string
    qr_code_id: string
    table_number: string
    customer_name: string | null
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

    const fetchCalls = useCallback(async () => {
        setLoading(true)
        try {
            console.log('Fetching calls for restaurant:', restaurantId)
            const { data, error } = await supabase
                .from('waiter_calls')
                .select('*')
                .eq('restaurant_id', restaurantId)
                .order('created_at', { ascending: false })

            console.log('Fetch result:', { data, error })

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
    }, [restaurantId, toast])

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
    }, [restaurantId, fetchCalls])

    const updateCallStatus = async (callId: string, status: 'acknowledged' | 'completed' | 'cancelled') => {
        try {
            console.log('Updating call status:', { callId, status })

            const response = await fetch('/api/waiter-calls', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: callId, status })
            })

            const result = await response.json()
            console.log('Update response:', result)

            if (!response.ok) {
                throw new Error(result.error || 'Failed to update')
            }

            toast({
                title: '✅ Başarılı',
                description: status === 'acknowledged' ? 'Çağrı kabul edildi' :
                    status === 'completed' ? 'Çağrı tamamlandı' : 'Çağrı iptal edildi'
            })

            // Refresh calls
            fetchCalls()
        } catch (error: any) {
            console.error('Update error:', error)
            toast({
                variant: 'destructive',
                title: '❌ Hata',
                description: error.message || 'Durum güncellenemedi'
            })
        }
    }

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-500 hover:bg-yellow-600',
            acknowledged: 'bg-blue-500 hover:bg-blue-600',
            completed: 'bg-green-500 hover:bg-green-600',
            cancelled: 'bg-gray-500 hover:bg-gray-600'
        }
        return styles[status as keyof typeof styles] || 'bg-gray-500'
    }

    const activeCalls = calls.filter(c => c.status === 'pending' || c.status === 'acknowledged')
    const completedCalls = calls.filter(c => c.status === 'completed' || c.status === 'cancelled')
    const pendingCount = calls.filter(c => c.status === 'pending').length
    const acknowledgedCount = calls.filter(c => c.status === 'acknowledged').length

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground">Yükleniyor...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-yellow-700 dark:text-yellow-300 flex items-center gap-2">
                            <Bell className="h-4 w-4" />
                            Bekleyen Çağrılar
                        </CardTitle>
                        <div className="text-3xl font-bold text-yellow-900 dark:text-yellow-100">{pendingCount}</div>
                    </CardHeader>
                </Card>
                <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300 flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Kabul Edildi
                        </CardTitle>
                        <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{acknowledgedCount}</div>
                    </CardHeader>
                </Card>
                <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            Tamamlanan
                        </CardTitle>
                        <div className="text-3xl font-bold text-green-900 dark:text-green-100">{completedCalls.length}</div>
                    </CardHeader>
                </Card>
            </div>

            {/* Tabs for Active/Completed */}
            <Tabs defaultValue="active" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active" className="relative">
                        Aktif Çağrılar
                        {activeCalls.length > 0 && (
                            <Badge className="ml-2 bg-red-500 text-white">{activeCalls.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                        Geçmiş Çağrılar
                        {completedCalls.length > 0 && (
                            <Badge className="ml-2" variant="secondary">{completedCalls.length}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Active Calls Tab */}
                <TabsContent value="active" className="space-y-4 mt-6">
                    {activeCalls.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground text-lg">Aktif çağrı bulunmuyor</p>
                                <p className="text-sm text-muted-foreground mt-1">Yeni çağrılar bu alanda görünecek</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {activeCalls.map((call) => (
                                <Card
                                    key={call.id}
                                    className={`${call.status === 'pending' ? 'border-yellow-500 border-2 shadow-lg' : 'border-blue-500 border-2'} transition-all hover:shadow-xl`}
                                >
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <Bell className={`h-5 w-5 ${call.status === 'pending' ? 'text-yellow-600 animate-pulse' : 'text-blue-600'}`} />
                                                    <h3 className="text-xl font-bold">Masa {call.table_number}</h3>
                                                    <Badge className={getStatusBadge(call.status)}>
                                                        {call.status === 'pending' ? '🔔 Bekliyor' : '✓ Kabul Edildi'}
                                                    </Badge>
                                                </div>
                                                {call.customer_name && (
                                                    <p className="text-sm text-muted-foreground">Müşteri: <span className="font-medium">{call.customer_name}</span></p>
                                                )}
                                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    {formatDistanceToNow(new Date(call.created_at), { addSuffix: true, locale: tr })}
                                                </p>
                                            </div>

                                            <div className="flex gap-2 flex-shrink-0">
                                                {call.status === 'pending' && (
                                                    <>
                                                        <Button
                                                            size="lg"
                                                            variant="default"
                                                            onClick={() => updateCallStatus(call.id, 'acknowledged')}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            <Check className="h-4 w-4 mr-2" />
                                                            Kabul Et
                                                        </Button>
                                                        <Button
                                                            size="lg"
                                                            variant="destructive"
                                                            onClick={() => updateCallStatus(call.id, 'cancelled')}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}

                                                {call.status === 'acknowledged' && (
                                                    <Button
                                                        size="lg"
                                                        variant="default"
                                                        onClick={() => updateCallStatus(call.id, 'completed')}
                                                        className="bg-blue-600 hover:bg-blue-700"
                                                    >
                                                        <CheckCircle2 className="h-4 w-4 mr-2" />
                                                        Tamamla
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Completed Calls Tab */}
                <TabsContent value="completed" className="space-y-4 mt-6">
                    {completedCalls.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                                <p className="text-muted-foreground text-lg">Henüz tamamlanmış çağrı yok</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {completedCalls.map((call) => (
                                <Card key={call.id} className="opacity-75 hover:opacity-100 transition-opacity">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    {call.status === 'completed' ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                                    ) : (
                                                        <X className="h-5 w-5 text-gray-600" />
                                                    )}
                                                    <h3 className="text-lg font-semibold text-muted-foreground">Masa {call.table_number}</h3>
                                                    <Badge variant="secondary" className={call.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                                        {call.status === 'completed' ? '✓ Tamamlandı' : '✕ İptal Edildi'}
                                                    </Badge>
                                                </div>
                                                {call.customer_name && (
                                                    <p className="text-sm text-muted-foreground">Müşteri: {call.customer_name}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(call.created_at), { addSuffix: true, locale: tr })}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
