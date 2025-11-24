'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface User {
  id: string
  email: string
  full_name: string | null
  role: string
  phone: string | null
  last_login_at: string | null
  is_active: boolean
  created_at: string
  avatar_url: string | null
}

interface UsersListProps {
  users: User[]
}

export default function UsersList({ users }: UsersListProps) {
  const getRoleBadge = (role: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      platform_admin: 'destructive',
      restaurant_admin: 'default',
      staff: 'secondary',
    }
    const labels: Record<string, string> = {
      platform_admin: 'Platform Yöneticisi',
      restaurant_admin: 'Restoran Yöneticisi',
      staff: 'Personel',
    }
    return (
      <Badge variant={variants[role] || 'outline'}>
        {labels[role] || role}
      </Badge>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kullanıcı</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Telefon</TableHead>
            <TableHead>Son Giriş</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Kayıt Tarihi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                Kullanıcı bulunamadı.
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.full_name || 'İsimsiz'}</div>
                      <div className="text-sm text-slate-500">{user.email}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getRoleBadge(user.role)}</TableCell>
                <TableCell>{user.phone || '-'}</TableCell>
                <TableCell>
                  {user.last_login_at
                    ? formatDistanceToNow(new Date(user.last_login_at), {
                        addSuffix: true,
                        locale: tr,
                      })
                    : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? 'outline' : 'secondary'}>
                    {user.is_active ? 'Aktif' : 'Pasif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-slate-600">
                  {formatDistanceToNow(new Date(user.created_at), {
                    addSuffix: true,
                    locale: tr,
                  })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
