'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Award, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export default function AnalyticsPage() {
    const [employeeStats, setEmployeeStats] = useState<any[]>([])
    const [complaints, setComplaints] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    // const supabase = createClient() - Removed
    const { toast } = useToast()

    const [stats, setStats] = useState<{
        day: { name: string, count: number } | null,
        week: { name: string, count: number } | null,
        month: { name: string, count: number } | null
    }>({ day: null, week: null, month: null })

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            // 1. Fetch Logs with Profiles
            const { data: logs, error: logsError } = await supabase
                .from('admin_activity_logs')
                .select('created_at, profile_id, profiles(full_name)')
                .order('created_at', { ascending: false })

            if (logsError) throw logsError

            if (logs) {
                const now = new Date()
                const startOfDay = new Date(now.setHours(0, 0, 0, 0))

                const startOfWeek = new Date(now)
                startOfWeek.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)) // Monday
                startOfWeek.setHours(0, 0, 0, 0)

                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

                const counts = {
                    day: {} as Record<string, { count: number, name: string }>,
                    week: {} as Record<string, { count: number, name: string }>,
                    month: {} as Record<string, { count: number, name: string }>,
                    total: {} as Record<string, { count: number, name: string }>
                }

                logs.forEach((log: any) => {
                    const logDate = new Date(log.created_at)
                    const name = log.profiles?.full_name || 'Bilinmeyen'
                    const id = log.profile_id

                    // Total (for chart)
                    if (!counts.total[id]) counts.total[id] = { count: 0, name }
                    counts.total[id].count++

                    // Day
                    if (logDate >= startOfDay) {
                        if (!counts.day[id]) counts.day[id] = { count: 0, name }
                        counts.day[id].count++
                    }

                    // Week
                    if (logDate >= startOfWeek) {
                        if (!counts.week[id]) counts.week[id] = { count: 0, name }
                        counts.week[id].count++
                    }

                    // Month
                    if (logDate >= startOfMonth) {
                        if (!counts.month[id]) counts.month[id] = { count: 0, name }
                        counts.month[id].count++
                    }
                })

                // Find winners
                const getWinner = (record: Record<string, { count: number, name: string }>) => {
                    const sorted = Object.values(record).sort((a, b) => b.count - a.count)
                    return sorted.length > 0 ? sorted[0] : null
                }

                setStats({
                    day: getWinner(counts.day),
                    week: getWinner(counts.week),
                    month: getWinner(counts.month)
                })

                // Format for chart
                const chartData = Object.values(counts.total).map(item => ({
                    name: item.name,
                    actions: item.count
                })).sort((a, b) => b.actions - a.actions).slice(0, 10) // Top 10

                setEmployeeStats(chartData)
            }

            // Fetch Complaints
            const { data: complaintsData, error } = await supabase
                .from('review_complaints')
                .select('*, reviews(*), restaurants(name)')
                .order('created_at', { ascending: false })

            if (error) throw error
            setComplaints(complaintsData || [])

        } catch (error) {
            console.error('Error fetching analytics:', error)
            toast({ title: 'Veri Hatası', description: 'Analitik verileri yüklenemedi.', variant: 'destructive' })
        } finally {
            setLoading(false)
        }
    }, [toast])

    useEffect(() => {
        fetchData()
    }, [fetchData])

    const handleComplaintAction = async (id: string, status: 'approved' | 'rejected') => {
        try {
            const { error } = await supabase
                .from('review_complaints')
                .update({ status })
                .eq('id', id)

            if (error) throw error

            // If approved, we might want to hide the review or take other actions
            if (status === 'approved') {
                const complaint = complaints.find(c => c.id === id)
                if (complaint) {
                    await supabase.from('reviews').update({ is_published: false }).eq('id', complaint.review_id)
                }
            }

            toast({ title: 'İşlem Başarılı', description: `Şikayet ${status === 'approved' ? 'onaylandı' : 'reddedildi'}.` })
            fetchData()
        } catch (error) {
            toast({ title: 'Hata', description: 'İşlem gerçekleştirilemedi.', variant: 'destructive' })
        }
    }

    const bestEmployee = employeeStats.reduce((prev, current) => (prev.actions > current.actions) ? prev : current, { actions: 0 })

    if (loading) return <div>Yükleniyor...</div>

    return (
        <div className="container py-6 space-y-6">
            <h1 className="text-2xl font-bold">Platform Analitik & Yönetim</h1>

            <Tabs defaultValue="analytics">
                <TabsList>
                    <TabsTrigger value="analytics">Analitik</TabsTrigger>
                    <TabsTrigger value="complaints">Şikayetler</TabsTrigger>
                </TabsList>

                <TabsContent value="analytics" className="space-y-6">
                    {/* Top Performers Cards */}
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Günün Çalışanı</CardTitle>
                                <Award className="h-4 w-4 text-blue-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.day?.name || '-'}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.day ? `${stats.day.count} işlem` : 'Henüz işlem yok'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Haftanın Çalışanı</CardTitle>
                                <Award className="h-4 w-4 text-purple-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.week?.name || '-'}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.week ? `${stats.week.count} işlem` : 'Henüz işlem yok'}
                                </p>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ayın Çalışanı</CardTitle>
                                <Award className="h-4 w-4 text-yellow-600" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.month?.name || '-'}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.month ? `${stats.month.count} işlem` : 'Henüz işlem yok'}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Personel Performansı (Son 30 Gün)</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={employeeStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="actions" fill="#8884d8" name="Toplam İşlem" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="complaints">
                    <div className="grid gap-4">
                        {complaints.length === 0 && <div className="text-center text-muted-foreground">Bekleyen şikayet yok.</div>}
                        {complaints.map((complaint) => (
                            <Card key={complaint.id} className={complaint.status !== 'pending' ? 'opacity-60' : ''}>
                                <CardHeader>
                                    <CardTitle className="text-base flex justify-between">
                                        <span>{complaint.restaurants?.name} - Şikayet</span>
                                        <span className={`text-sm px-2 py-1 rounded capitalize ${complaint.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            complaint.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                            {complaint.status}
                                        </span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="bg-muted p-3 rounded text-sm">
                                        <span className="font-semibold block mb-1">Şikayet Nedeni:</span>
                                        {complaint.reason}
                                    </div>
                                    <div className="border p-3 rounded text-sm">
                                        <span className="font-semibold block mb-1">İlgili Yorum:</span>
                                        &quot;{complaint.reviews?.comment}&quot; ({complaint.reviews?.rating} Yıldız)
                                    </div>

                                    {complaint.status === 'pending' && (
                                        <div className="flex gap-2 justify-end">
                                            <Button variant="outline" size="sm" onClick={() => handleComplaintAction(complaint.id, 'rejected')}>
                                                <XCircle className="h-4 w-4 mr-2" /> Reddet
                                            </Button>
                                            <Button variant="destructive" size="sm" onClick={() => handleComplaintAction(complaint.id, 'approved')}>
                                                <CheckCircle2 className="h-4 w-4 mr-2" /> Onayla (Yorumu Kaldır)
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
