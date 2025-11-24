import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Giriş Yap - VERA QR',
  description: 'VERA QR admin paneline giriş yapın',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
    </>
  )
}
