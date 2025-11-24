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
import { Edit, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'

interface Props {
  qrCode: {
    id: string
    table_number: string
    location_description: string | null
  }
}

export default function EditTableDialog({ qrCode }: Props) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = new FormData(e.currentTarget)
    const tableNumber = formData.get('table_number') as string
    const locationDescription = formData.get('location_description') as string

    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({
          table_number: tableNumber,
          location_description: locationDescription,
        })
        .eq('id', qrCode.id)

      if (error) throw error

      toast({
        title: 'Başarılı',
        description: 'Masa bilgileri güncellendi',
      })
      setOpen(false)
      router.refresh()
    } catch (error: any) {
      toast({
        title: 'Hata',
        description: error.message || 'Güncelleme başarısız',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="dark:text-slate-200"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Masa Düzenle</DialogTitle>
          <DialogDescription>
            Masa numarası ve konumunu güncelleyin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="table_number" className="text-right">
                Masa No
              </Label>
              <Input
                id="table_number"
                name="table_number"
                defaultValue={qrCode.table_number}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="location_description" className="text-right">
                Konum
              </Label>
              <Input
                id="location_description"
                name="location_description"
                defaultValue={qrCode.location_description || ''}
                placeholder="Örn: Teras"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Güncelle
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
