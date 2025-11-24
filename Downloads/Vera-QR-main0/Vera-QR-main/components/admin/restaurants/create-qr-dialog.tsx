'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Loader2 } from 'lucide-react'
import { createQRCode } from '@/app/admin/restaurants/actions'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface CreateQRDialogProps {
  restaurantId: string
}

export default function CreateQRDialog({ restaurantId }: CreateQRDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    const formData = new FormData(event.currentTarget)

    const result = await createQRCode(restaurantId, formData)

    setIsLoading(false)

    if (result.error) {
      toast({
        title: "Hata",
        description: result.error,
        variant: "destructive"
      })
    } else {
      toast({
        title: "Başarılı",
        description: "Yeni QR kod oluşturuldu.",
      })
      setOpen(false)
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Yeni QR Ekle
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Yeni QR Kod Oluştur</DialogTitle>
            <DialogDescription>
              Masa için yeni bir QR kod oluşturun.
            </DialogDescription>
          </DialogHeader>
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
                placeholder="Örn: Bahçe"
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
  )
}
