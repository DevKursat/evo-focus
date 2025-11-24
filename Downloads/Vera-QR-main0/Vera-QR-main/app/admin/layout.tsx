import { redirect } from 'next/navigation'
import { isPlatformAdmin } from '@/lib/supabase/auth'
import { Toaster } from '@/components/ui/toaster'
import AdminSidebar from '@/components/admin/admin-sidebar'
import AdminHeader from '@/components/admin/admin-header'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  console.log('🔐 Admin Layout - Render başladı')
  const isAdmin = await isPlatformAdmin()
  
  console.log('🔐 Admin Layout - isPlatformAdmin sonucu:', isAdmin)
  
  if (!isAdmin) {
    console.log('❌ Admin Layout - Admin değil, login\'e yönlendiriliyor')
    redirect('/auth/login')
  }

  console.log('✅ Admin Layout - Admin doğrulandı, layout render ediliyor')

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      <AdminSidebar />
      <div className="lg:pl-64">
        <AdminHeader />
        <main className="p-6">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  )
}
