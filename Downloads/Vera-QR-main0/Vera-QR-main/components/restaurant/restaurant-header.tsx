'use client'

import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ExternalLink, LogOut, User } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggle, LanguageToggle } from '@/components/shared/theme-language-toggle'
import { useApp } from '@/lib/app-context'

interface Props {
  admin: any
}

export default function RestaurantHeader({ admin }: Props) {
  const router = useRouter()
  const { t } = useApp()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  return (
    <header className="h-16 border-b border-slate-200 dark:border-border bg-white dark:bg-background flex items-center justify-between px-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/${admin.restaurant?.slug}`}
          target="_blank"
          className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ExternalLink className="h-4 w-4" />
          {t.common.viewLive}
        </Link>
      </div>
      
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <LanguageToggle />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 ml-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {admin.profile?.full_name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden md:block dark:text-slate-200">
                {admin.profile?.full_name}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{admin.profile?.full_name}</p>
                <p className="text-xs text-slate-500 capitalize">{admin.profile?.role}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              {t.common.profile}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              {t.common.logout}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
