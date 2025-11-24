import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import { ThemeProvider } from '@/components/theme-provider'
import { AppProvider } from '@/lib/app-context'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'VERAQR | AI-Powered QR Menu System',
  description: 'White-label SaaS platform for restaurants with AI menu assistant',
  keywords: ['QR menu', 'restaurant', 'AI assistant', 'digital menu', 'SaaS'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppProvider>
            {children}
            <Toaster />
          </AppProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
