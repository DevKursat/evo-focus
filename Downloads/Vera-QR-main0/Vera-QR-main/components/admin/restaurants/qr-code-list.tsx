'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Download, Trash2, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { deleteQRCodes } from '@/app/admin/restaurants/actions'
import { useToast } from '@/components/ui/use-toast'

interface QRCode {
  id: string
  table_number: string
  location_description: string | null
  qr_code_hash: string
  status: string
  scan_count: number
  created_at: string
}

interface QRCodeListProps {
  qrCodes: QRCode[]
  restaurantSlug: string
}

export default function QRCodeList({ qrCodes, restaurantSlug }: QRCodeListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const downloadQR = (hash: string, table: string) => {
    const url = `${window.location.origin}/menu/${restaurantSlug}?t=${hash}`
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`, '_blank')
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(qrCodes.map(qr => qr.id))
    } else {
      setSelectedIds([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id])
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id))
    }
  }

  const handleDelete = async () => {
    if (!confirm(`${selectedIds.length} adet QR kodu silmek istediğinize emin misiniz?`)) return

    setIsDeleting(true)
    try {
      const result = await deleteQRCodes(selectedIds)
      if (result.success) {
        toast({
          title: 'Başarılı',
          description: 'Seçilen QR kodlar silindi.',
        })
        setSelectedIds([])
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'QR kodlar silinemedi.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
          <span className="text-sm font-medium">{selectedIds.length} seçildi</span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
            Seçilenleri Sil
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={qrCodes.length > 0 && selectedIds.length === qrCodes.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Masa</TableHead>
              <TableHead>Konum</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-center">Okunma Sayısı</TableHead>
              <TableHead>Oluşturulma</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {qrCodes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                  Henüz QR kod oluşturulmamış.
                </TableCell>
              </TableRow>
            ) : (
              qrCodes.map((qr) => (
                <TableRow key={qr.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(qr.id)}
                      onCheckedChange={(checked) => handleSelectOne(qr.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{qr.table_number}</TableCell>
                  <TableCell>{qr.location_description || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={qr.status === 'active' ? 'default' : 'secondary'}>
                      {qr.status === 'active' ? 'Aktif' : qr.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">{qr.scan_count}</TableCell>
                  <TableCell className="text-sm text-slate-600">
                    {formatDistanceToNow(new Date(qr.created_at), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadQR(qr.qr_code_hash, qr.table_number)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        İndir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
