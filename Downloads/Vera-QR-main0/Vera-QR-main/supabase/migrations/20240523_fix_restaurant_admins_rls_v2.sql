-- Fix Infinite Recursion by dropping the problematic policy
-- We rely on Policy 1 (see own) and Service Role (admin panel) for now.

DROP POLICY IF EXISTS "Restaurant admins can view team members" ON restaurant_admins;

-- Optional: If we really need team visibility, we use a security definer function
-- But for now, let's just kill the recursion.

-- Ensure Policy 1 is correct and simple
DROP POLICY IF EXISTS "Users can view own restaurant links" ON restaurant_admins;
CREATE POLICY "Users can view own restaurant links"
ON restaurant_admins
FOR SELECT
USING (
  auth.uid() = profile_id
);

-- Ensure Platform Admin policy is correct
DROP POLICY IF EXISTS "Platform admins can view all restaurant links" ON restaurant_admins;
CREATE POLICY "Platform admins can view all restaurant links"
ON restaurant_admins
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'platform_admin'
  )
);
