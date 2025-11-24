'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Layers, Loader2 } from 'lucide-react'
import { createSingleQRCode, createBulkQRCodes } from '@/app/dashboard/tables/actions'
import { useToast } from '@/components/ui/use-toast'

export default function CreateQRDialogs({ restaurantId }: { restaurantId: string }) {
  const [openSingle, setOpenSingle] = useState(false)
  const [openBulk, setOpenBulk] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSingleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    const res = await createSingleQRCode(restaurantId, formData)
    setIsLoading(false)

    if (res.error) {
      toast({ title: 'Hata', description: res.error, variant: 'destructive' })
    } else {
      toast({ title: 'Başarılı', description: 'Masa oluşturuldu' })
      setOpenSingle(false)
    }
  }

  const handleBulkSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    const formData = new FormData(e.currentTarget)

    const res = await createBulkQRCodes(restaurantId, formData)
    setIsLoading(false)

    if (res.error) {
      toast({ title: 'Hata', description: res.error, variant: 'destructive' })
    } else {
      toast({ title: 'Başarılı', description: 'Masalar oluşturuldu' })
      setOpenBulk(false)
      // Force page reload to show new tables
      window.location.reload()
    }
  }

  return (
    <div className="flex gap-2">
      {/* SINGLE CREATE */}
      <Dialog open={openSingle} onOpenChange={setOpenSingle}>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Tek Masa Ekle
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Yeni Masa Ekle</DialogTitle>
            <DialogDescription>
              Tek bir masa için QR kodu oluşturun.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSingleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="table_number" className="text-right">
                  Masa No
                </Label>
                <Input
                  id="table_number"
                  name="table_number"
                  placeholder="Örn: Masa 5"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Konum
                </Label>
                <Input
                  id="location"
                  name="location_description"
                  placeholder="Örn: Teras"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Oluştur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* BULK CREATE */}
      <Dialog open={openBulk} onOpenChange={setOpenBulk}>
        <DialogTrigger asChild>
          <Button>
            <Layers className="mr-2 h-4 w-4" />
            Toplu Oluştur
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Toplu Masa Ekle</DialogTitle>
            <DialogDescription>
              Belirli bir aralıkta otomatik masa oluşturun.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBulkSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prefix" className="text-right">
                  Ön Ek
                </Label>
                <Input
                  id="prefix"
                  name="prefix"
                  defaultValue="Masa"
                  placeholder="Örn: Masa"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="start" className="text-right">
                  Başlangıç
                </Label>
                <Input
                  id="start"
                  name="start"
                  type="number"
                  min="1"
                  defaultValue="1"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="end" className="text-right">
                  Bitiş
                </Label>
                <Input
                  id="end"
                  name="end"
                  type="number"
                  min="1"
                  defaultValue="10"
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location_bulk" className="text-right">
                  Konum
                </Label>
                <Input
                  id="location_bulk"
                  name="location_description"
                  placeholder="Örn: Ana Salon"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Oluştur
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
