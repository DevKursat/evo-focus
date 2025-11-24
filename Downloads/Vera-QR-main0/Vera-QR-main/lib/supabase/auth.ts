import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from './types'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal errors
          }
        },
      },
    }
  )
}

export async function createAdminClient() {
  const cookieStore = cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle cookie setting errors
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle cookie removal errors
          }
        },
      },
    }
  )

  return supabase
}

// Get current authenticated user
export async function getCurrentUser() {
  const supabase = createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

// Check if user is platform admin
export async function isPlatformAdmin() {
  const user = await getCurrentUser()
  
  if (!user) {
    return false
  }
  
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .eq('role', 'platform_admin')
    .maybeSingle()
  
  return !!data
}

// Check if user is super admin (same as platform admin for now)
export async function isSuperAdmin() {
  return isPlatformAdmin()
}

// Get user's restaurant admin info
export async function getRestaurantAdminInfo() {
  const user = await getCurrentUser()
  if (!user) return null
  
  const supabase = createClient()

  // Check if user is platform admin first
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'platform_admin') {
    const cookieStore = cookies()
    const viewRestaurantId = cookieStore.get('admin_view_restaurant_id')?.value

    let restaurantQuery = supabase.from('restaurants').select('*')

    if (viewRestaurantId) {
      restaurantQuery = restaurantQuery.eq('id', viewRestaurantId)
    } else {
      // Fallback: Get the first active restaurant
      restaurantQuery = restaurantQuery.eq('status', 'active').order('created_at', { ascending: false }).limit(1)
    }

    const { data: restaurant } = await restaurantQuery.maybeSingle()

    if (restaurant) {
      return {
        id: 'platform_admin_override',
        profile_id: user.id,
        restaurant_id: restaurant.id,
        restaurant: restaurant,
        permissions: ['all']
      }
    }
  }

  const { data } = await supabase
    .from('restaurant_admins')
    .select('*, restaurant:restaurants(*)')
    .eq('profile_id', user.id)
    .maybeSingle()
  
  return data
}

// Check if user has access to restaurant
export async function hasRestaurantAccess(restaurantId: string) {
  const user = await getCurrentUser()
  if (!user) return false
  
  // Check if platform admin
  if (await isPlatformAdmin()) return true
  
  // Check if restaurant admin for this restaurant
  const supabase = createClient()
  const { data } = await supabase
    .from('restaurant_admins')
    .select('id')
    .eq('profile_id', user.id)
    .eq('restaurant_id', restaurantId)
    .maybeSingle()
  
  return !!data
}

// Get user role
export async function getUserRole(): Promise<'platform_admin' | 'restaurant_admin' | 'staff' | null> {
  const user = await getCurrentUser()
  if (!user) return null
  
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()
  
  return data?.role || null
}
