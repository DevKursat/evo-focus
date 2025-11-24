'use client'

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
import { Download, QrCode as QrIcon } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

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
  const downloadQR = (hash: string, table: string) => {
    // Simple text URL generation for now (real implementation would involve canvas/image generation)
    const url = `${window.location.origin}/menu/${restaurantSlug}?t=${hash}`
    window.open(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`, '_blank')
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
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
              <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                Henüz QR kod oluşturulmamış.
              </TableCell>
            </TableRow>
          ) : (
            qrCodes.map((qr) => (
              <TableRow key={qr.id}>
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
  )
}
