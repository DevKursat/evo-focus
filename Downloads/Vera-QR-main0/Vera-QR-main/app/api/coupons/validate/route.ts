import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const { code, restaurant_id, order_amount } = await request.json()

        if (!code || !restaurant_id) {
            return NextResponse.json({ valid: false, error: 'Eksik bilgi' }, { status: 400 })
        }

        const supabase = createClient()

        // Fetch coupon
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('restaurant_id', restaurant_id)
            .eq('is_active', true)
            .maybeSingle()

        if (error || !coupon) {
            return NextResponse.json({ valid: false, error: 'Kupon bulunamadı' })
        }

        // Check expiry
        const now = new Date()
        if (coupon.valid_from && new Date(coupon.valid_from) > now) {
            return NextResponse.json({ valid: false, error: 'Kupon henüz geçerli değil' })
        }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) {
            return NextResponse.json({ valid: false, error: 'Kupon süresi dolmuş' })
        }

        // Check min order amount
        if (coupon.min_order_amount && order_amount < coupon.min_order_amount) {
            return NextResponse.json({
                valid: false,
                error: `Minimum sipariş tutarı: ₺${coupon.min_order_amount}`
            })
        }

        // Check max uses
        if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
            return NextResponse.json({ valid: false, error: 'Kupon kullanım limitine ulaştı' })
        }

        return NextResponse.json({ valid: true, coupon })
    } catch (error) {
        console.error('Coupon validation error:', error)
        return NextResponse.json({ valid: false, error: 'Doğrulama hatası' }, { status: 500 })
    }
}
