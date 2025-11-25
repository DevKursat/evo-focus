-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. FIX ADMIN ROLE (CRITICAL & GLOBAL)
-- ==========================================
DO $$
BEGIN
    UPDATE public.profiles
    SET role = 'platform_admin'
    FROM auth.users
    WHERE public.profiles.id = auth.users.id
    AND auth.users.email = 'admin@veraqr.com';
END $$;

UPDATE public.profiles
SET role = 'platform_admin'
WHERE role = 'Platform Yöneticisi' OR role = 'Platform Admin';

-- ==========================================
-- 2. SECURITY DEFINER FUNCTION
-- ==========================================
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
        AND role = 'platform_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. HELPER FUNCTION FOR DYNAMIC RLS
-- ==========================================
CREATE OR REPLACE FUNCTION create_rls_policy(
    t_name text, 
    p_name text, 
    p_cmd text, 
    p_role text, 
    p_using text, 
    p_check text
) RETURNS void AS $$
BEGIN
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_name, t_name);
    
    IF p_cmd = 'ALL' THEN
        EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO %s USING (%s)', p_name, t_name, p_role, p_using);
    ELSIF p_cmd = 'SELECT' THEN
        EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO %s USING (%s)', p_name, t_name, p_role, p_using);
    ELSIF p_cmd = 'INSERT' THEN
        EXECUTE format('CREATE POLICY %I ON %I FOR INSERT TO %s WITH CHECK (%s)', p_name, t_name, p_role, p_check);
    ELSIF p_cmd = 'UPDATE' THEN
        EXECUTE format('CREATE POLICY %I ON %I FOR UPDATE TO %s USING (%s)', p_name, t_name, p_role, p_using);
    ELSIF p_cmd = 'DELETE' THEN
        EXECUTE format('CREATE POLICY %I ON %I FOR DELETE TO %s USING (%s)', p_name, t_name, p_role, p_using);
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create policy % on table %: %', p_name, t_name, SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 4. ENSURE COLUMNS & TABLES EXIST (SAFETY CHECK)
-- ==========================================
DO $$
BEGIN
    -- Restaurants: email, logo_url
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'email') THEN
        ALTER TABLE public.restaurants ADD COLUMN email VARCHAR(255);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'restaurants' AND column_name = 'logo_url') THEN
        ALTER TABLE public.restaurants ADD COLUMN logo_url TEXT;
    END IF;

    -- Categories: description, visible, display_order
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'description') THEN
        ALTER TABLE public.categories ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'visible') THEN
        ALTER TABLE public.categories ADD COLUMN visible BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'categories' AND column_name = 'display_order') THEN
        ALTER TABLE public.categories ADD COLUMN display_order INTEGER DEFAULT 0;
    END IF;

    -- Products: description, image_url, is_available, stock_count, allergens, ai_tags
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'description') THEN
        ALTER TABLE public.products ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'image_url') THEN
        ALTER TABLE public.products ADD COLUMN image_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_available') THEN
        ALTER TABLE public.products ADD COLUMN is_available BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'stock_count') THEN
        ALTER TABLE public.products ADD COLUMN stock_count INTEGER;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'allergens') THEN
        ALTER TABLE public.products ADD COLUMN allergens TEXT[];
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ai_tags') THEN
        ALTER TABLE public.products ADD COLUMN ai_tags TEXT[];
    END IF;

    -- Waiter Calls: customer_name
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'waiter_calls' AND column_name = 'customer_name') THEN
        ALTER TABLE public.waiter_calls ADD COLUMN customer_name VARCHAR;
    END IF;

    -- Reviews: is_published, reply
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'is_published') THEN
        ALTER TABLE public.reviews ADD COLUMN is_published BOOLEAN DEFAULT TRUE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'reply') THEN
        ALTER TABLE public.reviews ADD COLUMN reply TEXT;
    END IF;
END $$;

-- Ensure Loyalty Tables Exist
CREATE TABLE IF NOT EXISTS public.loyalty_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    customer_phone VARCHAR NOT NULL,
    total_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 5. STORAGE BUCKETS (Fix "Bucket not found")
-- ==========================================
-- Attempt to insert buckets if they don't exist. 
-- Note: This requires the 'storage' schema to be accessible.
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('restaurant-logos', 'restaurant-logos', true)
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO storage.buckets (id, name, public)
    VALUES ('product-images', 'product-images', true)
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('qr-codes', 'qr-codes', true)
    ON CONFLICT (id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not create storage buckets automatically. Ensure "storage" extension is enabled.';
END $$;

-- Storage Policies (Public Read, Auth Write)
DO $$
BEGIN
    -- LOGOS
    DROP POLICY IF EXISTS "Public Access Logos" ON storage.objects;
    CREATE POLICY "Public Access Logos" ON storage.objects FOR SELECT USING (bucket_id = 'restaurant-logos');
    
    DROP POLICY IF EXISTS "Auth Upload Logos" ON storage.objects;
    CREATE POLICY "Auth Upload Logos" ON storage.objects FOR INSERT WITH CHECK (
        bucket_id = 'restaurant-logos' AND auth.role() = 'authenticated'
    );

    -- PRODUCTS
    DROP POLICY IF EXISTS "Public Access Products" ON storage.objects;
    CREATE POLICY "Public Access Products" ON storage.objects FOR SELECT USING (bucket_id = 'product-images');
    
    DROP POLICY IF EXISTS "Auth Upload Products" ON storage.objects;
    CREATE POLICY "Auth Upload Products" ON storage.objects FOR INSERT WITH CHECK (
        bucket_id = 'product-images' AND auth.role() = 'authenticated'
    );
END $$;

-- ==========================================
-- 6. APPLY RLS TO ALL TABLES
-- ==========================================

DO $$
DECLARE
    tables text[] := ARRAY[
        'profiles', 'restaurants', 'restaurant_admins', 'categories', 'products', 
        'qr_codes', 'orders', 'order_items', 'ai_configs', 'ai_conversations', 
        'campaigns', 'coupons', 'loyalty_points', 'loyalty_rewards', 'notifications', 
        'platform_settings', 'waiter_calls', 'reviews', 'review_complaints', 
        'admin_activity_logs', 'game_sessions', 'admin_actions', 'admin_responses', 
        'call_requests', 'order_status_history', 'restaurant_users', 'webhook_configs'
    ];
    t text;
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
            
            -- USE THE SECURITY DEFINER FUNCTION HERE
            PERFORM create_rls_policy(
                t, 
                'Platform Admin Full Access', 
                'ALL', 
                'public', 
                'public.is_platform_admin()', 
                NULL
            );
        END IF;
    END LOOP;
END $$;

-- ==========================================
-- 7. SPECIFIC PUBLIC/RESTAURANT POLICIES
-- ==========================================

-- PROFILES
SELECT create_rls_policy('profiles', 'Users can see own profile', 'SELECT', 'public', 'auth.uid() = id', NULL);
SELECT create_rls_policy('profiles', 'Users can update own profile', 'UPDATE', 'public', 'auth.uid() = id', NULL);

-- RESTAURANTS
SELECT create_rls_policy('restaurants', 'Public Read Restaurants', 'SELECT', 'public', 'true', NULL);
SELECT create_rls_policy('restaurants', 'Restaurant Admin Update Self', 'UPDATE', 'public', 
    'EXISTS (SELECT 1 FROM public.restaurant_admins WHERE profile_id = auth.uid() AND restaurant_id = id)', NULL);

-- CATEGORIES & PRODUCTS
SELECT create_rls_policy('categories', 'Public Read Categories', 'SELECT', 'public', 'true', NULL);
SELECT create_rls_policy('categories', 'Restaurant Admin Manage Categories', 'ALL', 'public', 
    'EXISTS (SELECT 1 FROM public.restaurant_admins WHERE profile_id = auth.uid() AND restaurant_id = restaurant_id)', NULL);

SELECT create_rls_policy('products', 'Public Read Products', 'SELECT', 'public', 'true', NULL);
SELECT create_rls_policy('products', 'Restaurant Admin Manage Products', 'ALL', 'public', 
    'EXISTS (SELECT 1 FROM public.restaurant_admins WHERE profile_id = auth.uid() AND restaurant_id = restaurant_id)', NULL);

-- QR CODES
SELECT create_rls_policy('qr_codes', 'Public Read QR Codes', 'SELECT', 'public', 'true', NULL);

-- ORDERS & ORDER ITEMS
SELECT create_rls_policy('orders', 'Public Create Orders', 'INSERT', 'public', NULL, 'true');
SELECT create_rls_policy('orders', 'Public Read Orders', 'SELECT', 'public', 'true', NULL);
SELECT create_rls_policy('order_items', 'Public Create Order Items', 'INSERT', 'public', NULL, 'true');
SELECT create_rls_policy('order_items', 'Public Read Order Items', 'SELECT', 'public', 'true', NULL);

-- WAITER CALLS
SELECT create_rls_policy('waiter_calls', 'Public Create Calls', 'INSERT', 'public', NULL, 'true');
SELECT create_rls_policy('waiter_calls', 'Restaurant Admin View Calls', 'SELECT', 'public', 
    'EXISTS (SELECT 1 FROM public.restaurant_admins WHERE profile_id = auth.uid() AND restaurant_id = restaurant_id)', NULL);

-- REVIEWS
SELECT create_rls_policy('reviews', 'Public Create Reviews', 'INSERT', 'public', NULL, 'true');
SELECT create_rls_policy('reviews', 'Public Read Published Reviews', 'SELECT', 'public', 'is_published = true', NULL);
SELECT create_rls_policy('reviews', 'Restaurant Admin Manage Reviews', 'ALL', 'public', 
    'EXISTS (SELECT 1 FROM public.restaurant_admins WHERE profile_id = auth.uid() AND restaurant_id = restaurant_id)', NULL);

-- LOYALTY
SELECT create_rls_policy('loyalty_points', 'Restaurant Admin Manage Points', 'ALL', 'public', 
    'EXISTS (SELECT 1 FROM public.restaurant_admins WHERE profile_id = auth.uid() AND restaurant_id = restaurant_id)', NULL);
SELECT create_rls_policy('loyalty_rewards', 'Public Read Rewards', 'SELECT', 'public', 'true', NULL);
SELECT create_rls_policy('loyalty_rewards', 'Restaurant Admin Manage Rewards', 'ALL', 'public', 
    'EXISTS (SELECT 1 FROM public.restaurant_admins WHERE profile_id = auth.uid() AND restaurant_id = restaurant_id)', NULL);

-- GAME SESSIONS
SELECT create_rls_policy('game_sessions', 'Public Game Sessions', 'ALL', 'public', 'true', NULL);

-- AI CONVERSATIONS
DO $$
DECLARE
    col_name text;
BEGIN
    SELECT column_name INTO col_name 
    FROM information_schema.columns 
    WHERE table_name = 'ai_conversations' 
    AND column_name IN ('user_id', 'profile_id', 'customer_id')
    LIMIT 1;

    IF col_name IS NOT NULL THEN
        PERFORM create_rls_policy('ai_conversations', 'User View Own Convo', 'SELECT', 'public', format('auth.uid()::text = %I::text', col_name), NULL);
        PERFORM create_rls_policy('ai_conversations', 'User Insert Own Convo', 'INSERT', 'public', NULL, format('auth.uid()::text = %I::text', col_name));
    END IF;
END $$;

-- RESTAURANT ADMINS
SELECT create_rls_policy('restaurant_admins', 'Admin View Self', 'SELECT', 'public', 'auth.uid() = profile_id', NULL);

-- ==========================================
-- 8. CLEANUP
-- ==========================================
DROP FUNCTION IF EXISTS create_rls_policy;
