'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function sendNotification(formData: FormData) {
  const supabase = createClient()

  const title = formData.get('title') as string
  const message = formData.get('message') as string
  const target_role = formData.get('target_role') as string

  // Convert select value to array for storage
  const target_roles = target_role === 'all' ? ['all'] : [target_role]

  const { error } = await supabase
    .from('notifications')
    .insert({
      title,
      message,
      target_roles,
      created_at: new Date().toISOString()
    })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updateReviewStatus(reviewId: string, action: 'approve' | 'reject') {
    const supabase = createClient()

    // approve = Report Approved (Review Hidden/Removed)
    // reject = Report Rejected (Review Kept)

    const updates: any = {
        admin_resolution: action === 'approve' ? 'approved' : 'rejected'
    }

    // If report is approved (meaning the review IS bad), we unpublish it
    if (action === 'approve') {
        updates.is_published = false
    }

    const { error } = await supabase
        .from('reviews')
        .update(updates)
        .eq('id', reviewId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin/analytics')
    return { success: true }
}
