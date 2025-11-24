import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import UsersList from '@/components/admin/users/users-list'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage() {
  const supabase = createClient()
  let users = []

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
    } else {
      users = data || []
    }
  } catch (e) {
    console.error('Unexpected error fetching users:', e)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kullanıcılar</h1>
        <p className="text-slate-600 mt-1">
          Platform kullanıcılarını görüntüleyin ve yönetin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kullanıcı Listesi ({users?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <UsersList users={users} />
        </CardContent>
      </Card>
    </div>
  )
}
