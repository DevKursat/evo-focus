
-- ============================================================================
-- PLATFORM AYARLARI (Platform Settings)
-- ============================================================================

CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    site_name VARCHAR(255) DEFAULT 'Vera QR',
    support_email VARCHAR(255) DEFAULT 'support@veraqr.com',
    default_language VARCHAR(10) DEFAULT 'tr',
    maintenance_mode BOOLEAN DEFAULT false,
    security_2fa_required BOOLEAN DEFAULT false,
    session_timeout_minutes INTEGER DEFAULT 60,
    email_notifications_enabled BOOLEAN DEFAULT true,
    system_notifications_enabled BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES profiles(id)
);

-- Only one row allowed
CREATE UNIQUE INDEX idx_platform_settings_singleton ON platform_settings ((TRUE));

-- Policies
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Only platform admins can manage settings
CREATE POLICY "Platform adminler ayarları yönetebilir"
    ON platform_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

-- Everyone (or at least authenticated) can read (for maintenance mode check etc.)
CREATE POLICY "Herkes platform ayarlarını okuyabilir"
    ON platform_settings FOR SELECT
    USING (true);

-- Insert default row
INSERT INTO platform_settings (
    site_name, support_email, default_language
) VALUES (
    'Vera QR', 'support@veraqr.com', 'tr'
) ON CONFLICT DO NOTHING;
