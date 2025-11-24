'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

// Initialize admin client for auth management (Service Role)
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function createRestaurantWithAdmin(data: any) {
  const supabase = createClient()

  try {
    let userId: string

    // 1. Try to find existing profile (Scalable approach)
    // Since profiles are 1:1 with auth users, this helps us find the ID without listing all users
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('email', data.admin_email)
      .single()

    if (existingProfile) {
      userId = existingProfile.id
      console.log(`User profile already exists (${data.admin_email}), linking...`)

      // Update password if provided
      if (data.admin_password) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: data.admin_password
        })
      }

      // Update role if needed (don't downgrade platform_admin)
      if (existingProfile.role !== 'platform_admin') {
        await supabaseAdmin
          .from('profiles')
          .update({ role: 'restaurant_admin' })
          .eq('id', userId)
      }

    } else {
      // No profile found, try to create user
      // If auth user exists but profile doesn't (rare edge case), createUser will fail
      try {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: data.admin_email,
          password: data.admin_password,
          email_confirm: true,
          user_metadata: { full_name: data.name + ' Admin' }
        })

        if (authError) throw authError
        if (!authUser.user) throw new Error('Kullanıcı oluşturulamadı.')

        userId = authUser.user.id
      } catch (error: any) {
        // If error is "User already registered" but profile didn't exist
        if (error.message?.includes('already been registered') || error.status === 422) {
          console.log('User exists in Auth but not Profile. Attempting recovery...')
          // Fallback: We must find the ID. Since we can't query by email easily without listUsers
          // and we want to avoid listUsers, we're in a tight spot.
          // However, for this specific edge case, we can try to fetch the user by list (filtered)
          // Note: supabase-js admin.listUsers() does not support email filter.
          // We will assume this edge case is rare enough or manual intervention needed,
          // OR we accept the risk of listUsers just for this error catch block.

          const { data: users } = await supabaseAdmin.auth.admin.listUsers()
          const found = users?.users.find(u => u.email === data.admin_email)

          if (found) {
            userId = found.id
          } else {
             throw new Error('Kullanıcı zaten kayıtlı fakat profili bulunamadı ve erişilemiyor.')
          }
        } else {
          throw error
        }
      }

      // Ensure Profile Exists
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: userId,
          email: data.admin_email,
          role: 'restaurant_admin',
          full_name: data.name + ' Yöneticisi',
          is_active: true
        })

      if (profileError) throw new Error(`Profil oluşturulamadı: ${profileError.message}`)
    }

    // 3. Create Restaurant
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .insert({
        name: data.name,
        slug: data.slug,
        description: data.description,
        address: data.address,
        primary_color: data.brand_color,
        working_hours: data.working_hours,
        logo_url: data.logo_url,
        status: 'active',
        subscription_tier: 'starter',
      })
      .select()
      .single()

    if (restaurantError) {
        // Cleanup user if restaurant fails? Ideally yes, but for MVP let's just error.
        // await supabaseAdmin.auth.admin.deleteUser(userId)
        throw new Error(`Restoran oluşturulamadı: ${restaurantError.message}`)
    }

    // 4. Link Admin to Restaurant
    // Use supabaseAdmin for this insert to bypass RLS policies if necessary
    // (though public insert might be allowed, linking is sensitive)
    const { error: linkError } = await supabaseAdmin
      .from('restaurant_admins')
      .insert({
        profile_id: userId,
        restaurant_id: restaurant.id,
        permissions: ['all']
      })

    if (linkError) {
       console.error("Link Error:", linkError)
       throw new Error(`Yönetici yetkisi verilemedi: ${linkError.message}`)
    }

    // 4.5 Add Additional Admins if provided
    if (data.admins && Array.isArray(data.admins) && data.admins.length > 0) {
      for (const admin of data.admins) {
        // Using addRestaurantAdmin here might be tricky due to circular deps or context
        // Let's replicate simple logic or call it if possible.
        // Since addRestaurantAdmin is exported in same file, we can call it directly?
        // Yes, but 'this' context might be weird. It's safer to replicate simple logic or move logic to helper.
        // Let's just use the same robust logic as addRestaurantAdmin but inline or helper.
        // ACTUALLY, we can just call addRestaurantAdmin! It is an async function in the same module.
        try {
           await addRestaurantAdmin(restaurant.id, admin.email, admin.name)
        } catch (err) {
           console.error(`Failed to add additional admin ${admin.email}:`, err)
           // Don't fail the whole creation for this
        }
      }
    }

    // 5. Create AI Config
    await supabase.from('ai_configs').insert({
      restaurant_id: restaurant.id,
      personality: data.ai_personality,
      custom_prompt: `Sen ${data.name}'nin AI asistanısın. Müşterilere yardımcı ol, menü hakkında bilgi ver ve sipariş almalarına yardım et.`,
      language: 'tr',
      auto_translate: true,
      model: 'gpt-4',
    })

    // 6. Create Default Categories
    if (data.categories && data.categories.length > 0) {
        const categoryPromises = data.categories.map((name: string, index: number) =>
            supabase.from('categories').insert({
                restaurant_id: restaurant.id,
                name_tr: name,
                display_order: index,
                visible: true
            })
        )
        await Promise.all(categoryPromises)
    }

    // 7. Create Default QR Codes (10 tables)
    const crypto = require('crypto')
    const qrPromises = Array.from({ length: 10 }, (_, i) => {
        const tableNumber = `Masa ${i + 1}`
        const hash = crypto.randomBytes(16).toString('hex') // Generate here for safety
        return supabase.from('qr_codes').insert({
          restaurant_id: restaurant.id,
          table_number: tableNumber,
          qr_code_hash: hash,
          location_description: i < 5 ? 'Ana Salon' : 'Teras',
          status: 'active',
        })
    })
    await Promise.all(qrPromises)

    revalidatePath('/admin/restaurants')
    return { success: true, restaurantId: restaurant.id }

  } catch (error: any) {
    console.error('Create Restaurant Error:', error)
    // Return explicit error to UI
    return { error: error.message || JSON.stringify(error) }
  }
}

export async function updateRestaurant(id: string, data: any) {
  const supabase = createClient()

  // Update restaurant details
  const { error } = await supabase
    .from('restaurants')
    .update({
      name: data.name,
      slug: data.slug,
      status: data.status,
      subscription_tier: data.subscription_tier,
      description: data.description,
      address: data.address,
      primary_color: data.brand_color,
      working_hours: data.working_hours,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) {
    console.error('Error updating restaurant:', error)
    return { error: error.message }
  }

  // Update AI Config
  if (data.ai_personality) {
    const { error: aiError } = await supabase
      .from('ai_configs')
      .update({
        personality: data.ai_personality,
        // Also update prompt if personality changes? Optional but good for consistency
      })
      .eq('restaurant_id', id)

    if (aiError) console.error('Error updating AI config:', aiError)
  }

  revalidatePath('/admin/restaurants')
  revalidatePath(`/admin/restaurants/${id}/edit`)
  return { success: true }
}

// Admin Management
export async function getRestaurantAdmins(restaurantId: string) {
  // Use supabaseAdmin (Service Role) to bypass RLS for the admin panel list
  // This ensures the list is populated even if RLS policies are strict for the viewer
  const { data, error } = await supabaseAdmin
    .from('restaurant_admins')
    .select(`
      id,
      profile_id,
      created_at,
      profiles:profiles (
        id,
        email,
        full_name,
        role,
        created_at
      )
    `)
    .eq('restaurant_id', restaurantId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching restaurant admins:', error)
    throw new Error(error.message)
  }

  return data.map(item => ({
    link_id: item.id,
    profile: item.profiles
  }))
}

export async function addRestaurantAdmin(restaurantId: string, email: string, name: string, password?: string) {
  // 1. Find or Create User
  let userId: string

  // Try Profiles first
  const { data: existingProfile } = await supabaseAdmin
    .from('profiles')
    .select('id, role')
    .eq('email', email)
    .maybeSingle()

  if (existingProfile) {
    userId = existingProfile.id
    // Update info if needed
    if (password) {
        await supabaseAdmin.auth.admin.updateUserById(userId, { password })
    }
    // If adding as admin, maybe ensure they have role?
    // Actually, 'restaurant_admin' role is singular per system design usually, but let's assume we keep it.
    if (existingProfile.role !== 'platform_admin') {
        await supabaseAdmin.from('profiles').update({ role: 'restaurant_admin' }).eq('id', userId)
    }
  } else {
    // Try Auth Users
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const found = users?.users.find(u => u.email === email)

    if (found) {
        userId = found.id
    } else {
        // Create New User
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || 'tempPass123!', // Provide default or require password
            email_confirm: true,
            user_metadata: { full_name: name }
        })
        if (createError || !newUser.user) return { error: `Kullanıcı oluşturulamadı: ${createError?.message}` }
        userId = newUser.user.id
    }

    // Ensure Profile
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
        id: userId,
        email,
        full_name: name,
        role: 'restaurant_admin',
        is_active: true
    })
    if (profileError) return { error: `Profil güncellenemedi: ${profileError.message}` }
  }

  // 2. Link to Restaurant
  // Check existing link to avoid duplicates
  const { data: existingLink } = await supabaseAdmin
    .from('restaurant_admins')
    .select('id')
    .eq('restaurant_id', restaurantId)
    .eq('profile_id', userId)
    .maybeSingle()

  if (existingLink) {
    return { error: 'Bu kullanıcı zaten bu restoranın yöneticisi.' }
  }

  const { error: linkError } = await supabaseAdmin
    .from('restaurant_admins')
    .insert({
        restaurant_id: restaurantId,
        profile_id: userId,
        permissions: ['all']
    })

  if (linkError) return { error: `Bağlantı oluşturulamadı: ${linkError.message}` }

  revalidatePath(`/admin/restaurants/${restaurantId}/edit`)
  return { success: true }
}

export async function removeRestaurantAdmin(restaurantId: string, profileId: string) {
    const { error } = await supabaseAdmin
        .from('restaurant_admins')
        .delete()
        .eq('restaurant_id', restaurantId)
        .eq('profile_id', profileId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/admin/restaurants/${restaurantId}/edit`)
    return { success: true }
}

export async function createQRCode(restaurantId: string, formData: FormData) {
  const supabase = createClient()

  const table_number = formData.get('table_number') as string
  const location_description = formData.get('location_description') as string

  // Generate random hash for QR code
  const crypto = require('crypto')
  const qr_code_hash = crypto.randomBytes(16).toString('hex')

  const { error } = await supabase
    .from('qr_codes')
    .insert({
      restaurant_id: restaurantId,
      table_number,
      location_description,
      qr_code_hash,
      status: 'active'
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/restaurants/${restaurantId}/qr`)
  return { success: true }
}

export async function checkRestaurantSlug(slug: string, excludeId?: string) {
    // Use supabaseAdmin to bypass RLS for global checking
    let query = supabaseAdmin
        .from('restaurants')
        .select('id')
        .eq('slug', slug)

    if (excludeId) {
        query = query.neq('id', excludeId)
    }

    const { data, error } = await query.maybeSingle()

    if (error) {
        return { error: error.message }
    }

    return { isAvailable: !data }
}
