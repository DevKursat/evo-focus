-- Add Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    target_roles TEXT[] NOT NULL, -- e.g. ['restaurant_admin', 'staff']
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'notifications'
        AND policyname = 'Platform adminler bildirim oluşturabilir'
    ) THEN
        CREATE POLICY "Platform adminler bildirim oluşturabilir"
            ON notifications FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role = 'platform_admin'
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'notifications'
        AND policyname = 'Kullanıcılar kendilerine uygun bildirimleri görebilir'
    ) THEN
        CREATE POLICY "Kullanıcılar kendilerine uygun bildirimleri görebilir"
            ON notifications FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND (
                        'all' = ANY(notifications.target_roles) OR
                        role = ANY(notifications.target_roles)
                    )
                )
            );
    END IF;
END
$$;

-- Update Reviews Table
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_reported BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS report_reason TEXT,
ADD COLUMN IF NOT EXISTS admin_resolution VARCHAR(50) DEFAULT 'pending' CHECK (admin_resolution IN ('pending', 'approved', 'rejected'));

-- Ensure Platform Admins can manage reviews (if not already covered)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'reviews'
        AND policyname = 'Platform adminler tüm yorumları yönetebilir'
    ) THEN
        CREATE POLICY "Platform adminler tüm yorumları yönetebilir"
            ON reviews FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM profiles
                    WHERE id = auth.uid() AND role = 'platform_admin'
                )
            );
    END IF;
END
$$;
