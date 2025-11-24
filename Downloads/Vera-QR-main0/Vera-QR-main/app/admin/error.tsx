'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center">
      <h2 className="text-2xl font-bold mb-4">Bir şeyler yanlış gitti!</h2>
      <p className="mb-4 text-red-600 max-w-md break-words bg-red-50 p-4 rounded-md">
        {error.message || 'Beklenmeyen bir hata oluştu.'}
      </p>
      <Button onClick={() => reset()}>Tekrar Dene</Button>
    </div>
  )
}
