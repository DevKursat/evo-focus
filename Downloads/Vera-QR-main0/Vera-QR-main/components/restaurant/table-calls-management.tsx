'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Bell, CheckCircle, XCircle } from 'lucide-react'

interface TableCall {
  id: string
  table_number: string
  call_type: string
  status: string
  customer_note: string | null
  created_at: string
}

interface Props {
  initialCalls: TableCall[]
  restaurantId: string
}

const CALL_TYPES = {
  service: 'Servis',
  bill: 'Hesap',
  assistance: 'Yardım',
  complaint: 'Şikayet',
}

export default function TableCallsManagement({ initialCalls, restaurantId }: Props) {
  const [calls, setCalls] = useState<TableCall[]>(initialCalls)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    const channel = supabase
      .channel('table-calls-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'table_calls',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('table_calls')
              .select('*')
              .eq('id', payload.new.id)
              .single()

            if (data) {
              setCalls((prev) => [data, ...prev])
              new Audio('/notification.mp3').play().catch(() => {})
            }
          } else if (payload.eventType === 'UPDATE') {
            setCalls((prev) =>
              prev.map((call) =>
                call.id === payload.new.id ? { ...call, ...payload.new } : call
              )
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId])

  const updateCallStatus = async (callId: string, newStatus: string) => {
    const { error } = await (supabase
      .from('table_calls') as any)
      .update({ status: newStatus })
      .eq('id', callId)

    if (error) {
      console.error('Error updating call:', error)
      alert('Çağrı güncellenirken hata oluştu')
    }
  }

  const filteredCalls = calls.filter((call) => {
    if (activeTab === 'all') return true
    return call.status === activeTab
  })

  const pendingCount = calls.filter((c) => c.status === 'pending').length

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Badge className="text-lg px-4 py-2 bg-red-500">
          {pendingCount} Bekleyen Çağrı
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Tümü ({calls.length})</TabsTrigger>
          <TabsTrigger value="pending">Bekliyor ({pendingCount})</TabsTrigger>
          <TabsTrigger value="acknowledged">Onaylandı</TabsTrigger>
          <TabsTrigger value="resolved">Çözüldü</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredCalls.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-slate-500">Çağrı bulunamadı.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCalls.map((call) => (
                <Card key={call.id} className={call.status === 'pending' ? 'border-red-500 border-2' : ''}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Bell className="h-5 w-5" />
                          Masa {call.table_number}
                        </CardTitle>
                      </div>
                      <Badge>{CALL_TYPES[call.call_type as keyof typeof CALL_TYPES]}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">
                      {formatDistanceToNow(new Date(call.created_at), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {call.customer_note && (
                      <div className="p-2 bg-slate-50 rounded text-sm">
                        <strong>Not:</strong> {call.customer_note}
                      </div>
                    )}

                    <div className="flex gap-2">
                      {call.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateCallStatus(call.id, 'acknowledged')}
                            className="flex-1"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Onayla
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCallStatus(call.id, 'resolved')}
                          >
                            Çözüldü
                          </Button>
                        </>
                      )}
                      {call.status === 'acknowledged' && (
                        <Button
                          size="sm"
                          onClick={() => updateCallStatus(call.id, 'resolved')}
                          className="w-full"
                        >
                          Çözüldü Olarak İşaretle
                        </Button>
                      )}
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
