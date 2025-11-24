-- Add coupons table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2),
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, code)
);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Policies for coupons
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupons' AND policyname = 'Restaurant adminler kendi kuponlarını yönetebilir'
    ) THEN
        CREATE POLICY "Restaurant adminler kendi kuponlarını yönetebilir"
            ON coupons FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM restaurant_admins ra
                    WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'coupons' AND policyname = 'Platform adminler tüm kuponları yönetebilir'
    ) THEN
        CREATE POLICY "Platform adminler tüm kuponları yönetebilir"
            ON coupons FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role = 'platform_admin'
                )
            );
    END IF;
END
$$;

-- Trigger for updated_at
CREATE OR REPLACE TRIGGER update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Fix RLS for restaurants (Allow Platform Admin Update)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'restaurants' AND policyname = 'Platform adminler restoranları güncelleyebilir'
    ) THEN
        CREATE POLICY "Platform adminler restoranları güncelleyebilir"
            ON restaurants FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role = 'platform_admin'
                )
            );
    END IF;
END
$$;
