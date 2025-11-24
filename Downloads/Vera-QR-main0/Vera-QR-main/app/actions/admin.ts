'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function setAdminViewRestaurant(restaurantId: string) {
  const cookieStore = cookies()
  cookieStore.set('admin_view_restaurant_id', restaurantId, {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
  })

  redirect('/dashboard')
}
