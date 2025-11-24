import { redirect } from 'next/navigation'
import { getRestaurantAdminInfo, getCurrentUser } from '@/lib/supabase/auth'
import { Toaster } from '@/components/ui/toaster'
import RestaurantSidebar from '@/components/restaurant/restaurant-sidebar'
import RestaurantHeader from '@/components/restaurant/restaurant-header'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const adminInfo = await getRestaurantAdminInfo()
  
  if (!adminInfo) {
    // Check if user is logged in at least
    const user = await getCurrentUser()
    if (!user) {
      redirect('/auth/login')
    }

    // User is logged in but has no restaurant linked
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-background p-4">
            <div className="text-center space-y-4 max-w-md">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Restoran Bulunamadı</h1>
                <p className="text-slate-600 dark:text-slate-400">
                    Hesabınıza tanımlı bir restoran bulunamadı. Lütfen platform yöneticisi ile iletişime geçin.
                </p>
                <Link href="/auth/login">
                    <Button variant="outline">Çıkış Yap ve Tekrar Dene</Button>
                </Link>
            </div>
            <Toaster />
        </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <RestaurantSidebar restaurant={adminInfo.restaurant} />
      <div className="lg:pl-64">
        <RestaurantHeader admin={adminInfo} />
        <main className="p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
