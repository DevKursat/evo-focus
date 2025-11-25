-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Waiter Calls Table
CREATE TABLE IF NOT EXISTS public.waiter_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE SET NULL,
    table_number VARCHAR NOT NULL,
    customer_name VARCHAR,
    call_type VARCHAR DEFAULT 'service',
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waiter_calls' AND column_name = 'customer_name') THEN
        ALTER TABLE public.waiter_calls ADD COLUMN customer_name VARCHAR;
    END IF;
END $$;

-- 2. Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    reply TEXT,
    reply_at TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist for reviews
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'is_published') THEN
        ALTER TABLE public.reviews ADD COLUMN is_published BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'reply') THEN
        ALTER TABLE public.reviews ADD COLUMN reply TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'reply_at') THEN
        ALTER TABLE public.reviews ADD COLUMN reply_at TIMESTAMPTZ;
    END IF;
END $$;

-- 3. Review Complaints Table
CREATE TABLE IF NOT EXISTS public.review_complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status VARCHAR DEFAULT 'pending',
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Admin Activity Logs Table
CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type VARCHAR NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Game Sessions Table
CREATE TABLE IF NOT EXISTS public.game_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    game_type VARCHAR DEFAULT 'food_catcher',
    score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.waiter_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Drop first to avoid conflicts)

-- Waiter Calls
DROP POLICY IF EXISTS "Public can create waiter calls" ON public.waiter_calls;
CREATE POLICY "Public can create waiter calls" ON public.waiter_calls FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Restaurant admins can view their waiter calls" ON public.waiter_calls;
CREATE POLICY "Restaurant admins can view their waiter calls" ON public.waiter_calls FOR SELECT USING (
    auth.uid() IN (
        SELECT profile_id FROM public.restaurant_admins WHERE restaurant_id = public.waiter_calls.restaurant_id
    )
);

DROP POLICY IF EXISTS "Restaurant admins can update their waiter calls" ON public.waiter_calls;
CREATE POLICY "Restaurant admins can update their waiter calls" ON public.waiter_calls FOR UPDATE USING (
    auth.uid() IN (
        SELECT profile_id FROM public.restaurant_admins WHERE restaurant_id = public.waiter_calls.restaurant_id
    )
);

-- Reviews
DROP POLICY IF EXISTS "Public can view published reviews" ON public.reviews;
CREATE POLICY "Public can view published reviews" ON public.reviews FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Public can create reviews" ON public.reviews;
CREATE POLICY "Public can create reviews" ON public.reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Restaurant admins can view all reviews for their restaurant" ON public.reviews;
CREATE POLICY "Restaurant admins can view all reviews for their restaurant" ON public.reviews FOR SELECT USING (
    auth.uid() IN (
        SELECT profile_id FROM public.restaurant_admins WHERE restaurant_id = public.reviews.restaurant_id
    )
);

DROP POLICY IF EXISTS "Restaurant admins can update (reply) reviews" ON public.reviews;
CREATE POLICY "Restaurant admins can update (reply) reviews" ON public.reviews FOR UPDATE USING (
    auth.uid() IN (
        SELECT profile_id FROM public.restaurant_admins WHERE restaurant_id = public.reviews.restaurant_id
    )
);

-- Review Complaints
DROP POLICY IF EXISTS "Restaurant admins can create complaints" ON public.review_complaints;
CREATE POLICY "Restaurant admins can create complaints" ON public.review_complaints FOR INSERT WITH CHECK (
    auth.uid() IN (
        SELECT profile_id FROM public.restaurant_admins WHERE restaurant_id = public.review_complaints.restaurant_id
    )
);

DROP POLICY IF EXISTS "Restaurant admins can view their complaints" ON public.review_complaints;
CREATE POLICY "Restaurant admins can view their complaints" ON public.review_complaints FOR SELECT USING (
    auth.uid() IN (
        SELECT profile_id FROM public.restaurant_admins WHERE restaurant_id = public.review_complaints.restaurant_id
    )
);

DROP POLICY IF EXISTS "Platform admins can do everything on complaints" ON public.review_complaints;
CREATE POLICY "Platform admins can do everything on complaints" ON public.review_complaints FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'platform_admin'
    )
);

-- Admin Activity Logs
DROP POLICY IF EXISTS "Restaurant admins can view their logs" ON public.admin_activity_logs;
CREATE POLICY "Restaurant admins can view their logs" ON public.admin_activity_logs FOR SELECT USING (
    auth.uid() IN (
        SELECT profile_id FROM public.restaurant_admins WHERE restaurant_id = public.admin_activity_logs.restaurant_id
    )
);

DROP POLICY IF EXISTS "System can insert logs" ON public.admin_activity_logs;
CREATE POLICY "System can insert logs" ON public.admin_activity_logs FOR INSERT WITH CHECK (true);

-- Game Sessions
DROP POLICY IF EXISTS "Public can create game sessions" ON public.game_sessions;
CREATE POLICY "Public can create game sessions" ON public.game_sessions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view their own game sessions" ON public.game_sessions;
CREATE POLICY "Public can view their own game sessions" ON public.game_sessions FOR SELECT USING (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_waiter_calls_updated_at ON public.waiter_calls;
CREATE TRIGGER update_waiter_calls_updated_at BEFORE UPDATE ON public.waiter_calls FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_review_complaints_updated_at ON public.review_complaints;
CREATE TRIGGER update_review_complaints_updated_at BEFORE UPDATE ON public.review_complaints FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
