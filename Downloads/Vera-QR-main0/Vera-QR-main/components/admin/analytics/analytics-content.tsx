'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Send } from 'lucide-react'
import { sendNotification } from '@/app/admin/analytics/actions'
import OverviewCharts from './overview-charts'
import AdminReviewsList from './admin-reviews-list'

interface Props {
  revenueData: any[]
  statusData: any[]
}

export default function AdminAnalyticsContent({ revenueData, statusData }: Props) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isSending, setIsSending] = useState(false)
  const { toast } = useToast()

  const handleSendNotification = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSending(true)
    const formData = new FormData(e.currentTarget)

    const res = await sendNotification(formData)
    setIsSending(false)

    if (res.error) {
      toast({ title: 'Hata', description: res.error, variant: 'destructive' })
    } else {
      toast({ title: 'Başarılı', description: 'Bildirim gönderildi' })
      // Reset form
      e.currentTarget.reset()
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList>
        <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
        <TabsTrigger value="reviews">Yorumlar & Şikayetler</TabsTrigger>
        <TabsTrigger value="notifications">Bildirim Gönder</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <OverviewCharts revenueData={revenueData} statusData={statusData} />
      </TabsContent>

      <TabsContent value="reviews">
        <AdminReviewsList />
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
            <CardHeader>
                <CardTitle>Sistem Bildirimi Gönder</CardTitle>
                <CardDescription>
                    Belirli kullanıcı gruplarına veya herkese bildirim gönderin.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSendNotification} className="space-y-4 max-w-2xl">
                    <div className="space-y-2">
                        <Label>Hedef Kitle</Label>
                        <Select name="target_role" defaultValue="all">
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Herkese Gönder</SelectItem>
                                <SelectItem value="restaurant_admin">Sadece Restoran Yöneticileri</SelectItem>
                                <SelectItem value="staff">Sadece Personel</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Başlık</Label>
                        <Input name="title" placeholder="Bildirim başlığı..." required />
                    </div>

                    <div className="space-y-2">
                        <Label>Mesaj</Label>
                        <Textarea name="message" placeholder="Bildirim içeriği..." rows={4} required />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isSending}>
                            {isSending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="mr-2 h-4 w-4" />
                            )}
                            Gönder
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
