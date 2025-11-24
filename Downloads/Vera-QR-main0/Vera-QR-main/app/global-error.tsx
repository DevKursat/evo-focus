'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function GlobalError({
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
    <html>
      <body>
        <div className="flex h-screen flex-col items-center justify-center p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Uygulamada bir hata oluştu!</h2>
          <p className="mb-4 text-red-600 max-w-md break-words bg-red-50 p-4 rounded-md">
            {error.message || 'Beklenmeyen bir hata oluştu.'}
          </p>
          <Button onClick={() => reset()}>Tekrar Dene</Button>
        </div>
      </body>
    </html>
  )
}
