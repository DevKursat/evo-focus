-- ==========================================
-- FIX RLS POLICIES (AMBIGUITY RESOLUTION)
-- ==========================================

-- 1. PRODUCTS: Fix Ambiguous "restaurant_id" in EXISTS clause
DROP POLICY IF EXISTS "Restaurant Admin Manage Products" ON public.products;

CREATE POLICY "Restaurant Admin Manage Products" ON public.products
FOR ALL TO public
USING (
    EXISTS (
        SELECT 1 FROM public.restaurant_admins ra 
        WHERE ra.profile_id = auth.uid() 
        AND ra.restaurant_id = products.restaurant_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.restaurant_admins ra 
        WHERE ra.profile_id = auth.uid() 
        AND ra.restaurant_id = restaurant_id
    )
);

-- Ensure Public Read is definitely on
DROP POLICY IF EXISTS "Public Read Products" ON public.products;
CREATE POLICY "Public Read Products" ON public.products FOR SELECT TO public USING (true);


-- 2. CATEGORIES: Fix Ambiguous "restaurant_id"
DROP POLICY IF EXISTS "Restaurant Admin Manage Categories" ON public.categories;

CREATE POLICY "Restaurant Admin Manage Categories" ON public.categories
FOR ALL TO public
USING (
    EXISTS (
        SELECT 1 FROM public.restaurant_admins ra 
        WHERE ra.profile_id = auth.uid() 
        AND ra.restaurant_id = categories.restaurant_id
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.restaurant_admins ra 
        WHERE ra.profile_id = auth.uid() 
        AND ra.restaurant_id = restaurant_id
    )
);

-- Ensure Public Read is definitely on
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT TO public USING (true);


-- 3. WAITER CALLS: Ensure Public Insert is Allowed
DROP POLICY IF EXISTS "Public Create Calls" ON public.waiter_calls;

CREATE POLICY "Public Create Calls" ON public.waiter_calls
FOR INSERT TO public
WITH CHECK (true);

-- Ensure Restaurant Admins can view calls
DROP POLICY IF EXISTS "Restaurant Admin View Calls" ON public.waiter_calls;

CREATE POLICY "Restaurant Admin View Calls" ON public.waiter_calls
FOR SELECT TO public
USING (
    EXISTS (
        SELECT 1 FROM public.restaurant_admins ra 
        WHERE ra.profile_id = auth.uid() 
        AND ra.restaurant_id = waiter_calls.restaurant_id
    )
);

-- 4. QR CODES: Ensure Public Read (for API lookup)
DROP POLICY IF EXISTS "Public Read QR Codes" ON public.qr_codes;
CREATE POLICY "Public Read QR Codes" ON public.qr_codes FOR SELECT TO public USING (true);
