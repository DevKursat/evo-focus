-- ============================================================================
-- VERA QR - Supabase Veritabanı Şeması
-- ============================================================================
-- Bu script TEK SEFERDE tüm backend'i oluşturur (tablolar, bucket'lar, RLS vb.)
-- KULLANIM: Önce cleanup.sql çalıştırın, sonra bu dosyayı çalıştırın
-- ============================================================================

-- Gerekli uzantıları etkinleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- STORAGE BUCKET'LARI OLUŞTUR
-- ============================================================================

-- Restaurant logoları için bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'restaurant-logos',
    'restaurant-logos',
    true,
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Ürün görselleri için bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- QR kodları için bucket (PDF olarak da indirilecek)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'qr-codes',
    'qr-codes',
    true,
    1048576, -- 1MB limit
    ARRAY['image/png', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STORAGE POLİTİKALARI
-- ============================================================================

-- Restaurant logos - Herkes okuyabilir
CREATE POLICY "Restaurant logoları herkese açık"
ON storage.objects FOR SELECT
USING (bucket_id = 'restaurant-logos');

-- Restaurant logos - Sadece kimlik doğrulanmış kullanıcılar yükleyebilir
CREATE POLICY "Kimlik doğrulanmış kullanıcılar logo yükleyebilir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'restaurant-logos');

-- Restaurant logos - Sadece kendi dosyalarını silebilir
CREATE POLICY "Kullanıcılar kendi logolarını silebilir"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'restaurant-logos');

-- Product images - Herkes okuyabilir
CREATE POLICY "Ürün görselleri herkese açık"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Product images - Kimlik doğrulanmış kullanıcılar yükleyebilir
CREATE POLICY "Kimlik doğrulanmış kullanıcılar ürün görseli yükleyebilir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');

-- Product images - Kullanıcılar silebilir
CREATE POLICY "Kullanıcılar ürün görsellerini silebilir"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'product-images');

-- QR codes - Herkes okuyabilir
CREATE POLICY "QR kodları herkese açık"
ON storage.objects FOR SELECT
USING (bucket_id = 'qr-codes');

-- QR codes - Kimlik doğrulanmış kullanıcılar oluşturabilir
CREATE POLICY "Kimlik doğrulanmış kullanıcılar QR kodu oluşturabilir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'qr-codes');

-- ============================================================================
-- YENİ TABLOLAR
-- ============================================================================

-- Kullanıcı profilleri (auth.users ile bağlantılı)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) NOT NULL CHECK (role IN ('platform_admin', 'restaurant_admin', 'staff')),
    phone VARCHAR(50),
    last_login_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restoranlar (Tenant yapısı)
CREATE TABLE restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    address TEXT,
    wifi_ssid VARCHAR(255),
    wifi_password VARCHAR(255),
    webhook_url TEXT,
    api_key VARCHAR(255) UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    description TEXT,
    working_hours JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending')),
    subscription_tier VARCHAR(50) DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'pro', 'enterprise')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Restoran adminleri (Join table - profiles ve restaurants arasında)
CREATE TABLE restaurant_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '["all"]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, restaurant_id)
);

-- Menü kategorileri
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name_tr VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description TEXT,
    display_order INTEGER DEFAULT 0,
    visible BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ürünler (Menü öğeleri)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    name_tr VARCHAR(255) NOT NULL,
    name_en VARCHAR(255),
    description_tr TEXT,
    description_en TEXT,
    price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    allergens TEXT[] DEFAULT ARRAY[]::TEXT[],
    ai_tags TEXT[] DEFAULT ARRAY[]::TEXT[], -- AI asistan için etiketler
    is_available BOOLEAN DEFAULT true,
    stock_count INTEGER,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Konfigürasyonu (Her restoran için)
CREATE TABLE ai_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID UNIQUE NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    personality VARCHAR(50) DEFAULT 'professional' CHECK (personality IN ('friendly', 'professional', 'fun', 'formal', 'casual')),
    welcome_message_tr TEXT,
    welcome_message_en TEXT,
    custom_prompt TEXT,
    language VARCHAR(10) DEFAULT 'tr',
    auto_translate BOOLEAN DEFAULT true,
    voice_enabled BOOLEAN DEFAULT false,
    model VARCHAR(50) DEFAULT 'gpt-4',
    temperature DECIMAL(3,2) DEFAULT 0.7,
    max_tokens INTEGER DEFAULT 500,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Konuşmaları
CREATE TABLE ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Kampanyalar
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
    discount_amount DECIMAL(10,2),
    active BOOLEAN DEFAULT true,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    conditions JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analitik olayları
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB DEFAULT '{}'::jsonb,
    session_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Masa çağrıları
CREATE TABLE table_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    call_type VARCHAR(50) DEFAULT 'service' CHECK (call_type IN ('service', 'bill', 'assistance', 'complaint')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved', 'cancelled')),
    customer_note TEXT,
    resolved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QR Kod Tablosu (Masalar için)
CREATE TABLE qr_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    table_number VARCHAR(50) NOT NULL,
    qr_code_hash VARCHAR(255) UNIQUE NOT NULL,
    location_description TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'damaged')),
    scan_count INTEGER DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, table_number)
);

-- Siparişler
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    qr_code_id UUID REFERENCES qr_codes(id) ON DELETE SET NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    customer_notes TEXT,
    session_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled', 'paid')),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    service_charge DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sipariş Öğeleri
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL, -- Ürün silinirse isim kalacak
    product_price DECIMAL(10,2) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    notes TEXT, -- Özel istekler (az şekerli, baharatsız vb.)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Müşteri Yorumları ve Değerlendirmeler
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    customer_name VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    response TEXT, -- Restoran yanıtı
    responded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    responded_at TIMESTAMPTZ,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sadakat Programı - Müşteri Puanları
CREATE TABLE loyalty_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    customer_phone VARCHAR(50) NOT NULL, -- Telefon ile tanımlama
    customer_name VARCHAR(255),
    total_points INTEGER DEFAULT 0,
    lifetime_points INTEGER DEFAULT 0, -- Toplam kazanılan puan
    last_transaction_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(restaurant_id, customer_phone)
);

-- Sadakat Programı - Puan İşlemleri
CREATE TABLE loyalty_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loyalty_points_id UUID NOT NULL REFERENCES loyalty_points(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')),
    points INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sadakat Programı - Ödüller
CREATE TABLE loyalty_rewards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    points_required INTEGER NOT NULL,
    reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('discount_percentage', 'discount_amount', 'free_item', 'special_offer')),
    reward_value JSONB NOT NULL, -- {"percentage": 10} veya {"amount": 50} veya {"product_id": "uuid"}
    is_active BOOLEAN DEFAULT true,
    usage_limit INTEGER, -- Kaç kere kullanılabilir (null = sınırsız)
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sadakat Ödül Kullanımları
CREATE TABLE loyalty_reward_redemptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    loyalty_points_id UUID NOT NULL REFERENCES loyalty_points(id) ON DELETE CASCADE,
    loyalty_reward_id UUID NOT NULL REFERENCES loyalty_rewards(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Konfigürasyonları
CREATE TABLE webhook_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    secret_key VARCHAR(255) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    events TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    is_active BOOLEAN DEFAULT true,
    retry_enabled BOOLEAN DEFAULT true,
    max_retries INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 30,
    custom_headers JSONB DEFAULT '{}'::jsonb,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Delivery Logs
CREATE TABLE webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    webhook_config_id UUID NOT NULL REFERENCES webhook_configs(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_id VARCHAR(255) NOT NULL,
    request_url TEXT NOT NULL,
    request_method VARCHAR(10) DEFAULT 'POST',
    request_headers JSONB,
    request_body JSONB,
    request_signature VARCHAR(255),
    response_status INTEGER,
    response_body TEXT,
    response_time_ms INTEGER,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'retrying')),
    attempt_number INTEGER DEFAULT 1,
    error_message TEXT,
    delivered_at TIMESTAMPTZ,
    next_retry_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- İNDEKSLER (Performans için)
-- ============================================================================

CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_restaurant_admins_profile ON restaurant_admins(profile_id);
CREATE INDEX idx_restaurant_admins_restaurant ON restaurant_admins(restaurant_id);
CREATE INDEX idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX idx_products_restaurant ON products(restaurant_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_ai_conversations_restaurant ON ai_conversations(restaurant_id);
CREATE INDEX idx_ai_conversations_session ON ai_conversations(session_id);
CREATE INDEX idx_analytics_restaurant ON analytics_events(restaurant_id);
CREATE INDEX idx_analytics_type ON analytics_events(event_type);
CREATE INDEX idx_table_calls_restaurant ON table_calls(restaurant_id);
CREATE INDEX idx_qr_codes_restaurant ON qr_codes(restaurant_id);
CREATE INDEX idx_qr_codes_hash ON qr_codes(qr_code_hash);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);
CREATE INDEX idx_reviews_restaurant ON reviews(restaurant_id);
CREATE INDEX idx_reviews_published ON reviews(is_published);
CREATE INDEX idx_loyalty_points_restaurant ON loyalty_points(restaurant_id);
CREATE INDEX idx_loyalty_points_phone ON loyalty_points(customer_phone);
CREATE INDEX idx_loyalty_transactions_loyalty ON loyalty_transactions(loyalty_points_id);
CREATE INDEX idx_loyalty_rewards_restaurant ON loyalty_rewards(restaurant_id);
CREATE INDEX idx_webhook_configs_restaurant ON webhook_configs(restaurant_id);
CREATE INDEX idx_webhook_configs_active ON webhook_configs(is_active);
CREATE INDEX idx_webhook_logs_config ON webhook_logs(webhook_config_id);
CREATE INDEX idx_webhook_logs_restaurant ON webhook_logs(restaurant_id);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_next_retry ON webhook_logs(next_retry_at) WHERE status = 'retrying';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLİTİKALARI
-- ============================================================================

-- RLS'i etkinleştir
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE loyalty_reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Profiles politikaları
CREATE POLICY "Kullanıcılar kendi profillerini görebilir"
    ON profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Kullanıcılar kendi profillerini güncelleyebilir"
    ON profiles FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "Platform adminler tüm profilleri görebilir"
    ON profiles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

CREATE POLICY "Platform adminler profil oluşturabilir"
    ON profiles FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

-- Restaurants politikaları
CREATE POLICY "Platform adminler tüm restoranları görebilir"
    ON restaurants FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

CREATE POLICY "Restaurant adminler kendi restoranlarını görebilir"
    ON restaurants FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = id AND ra.profile_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant adminler kendi restoranlarını güncelleyebilir"
    ON restaurants FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = id AND ra.profile_id = auth.uid()
        )
    );

CREATE POLICY "Herkes restoranları görebilir (public menu için)"
    ON restaurants FOR SELECT
    USING (status = 'active');

-- Categories politikaları
CREATE POLICY "Platform adminler tüm kategorileri yönetebilir"
    ON categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

CREATE POLICY "Restaurant adminler kendi kategorilerini yönetebilir"
    ON categories FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
        )
    );

CREATE POLICY "Herkes aktif kategorileri görebilir"
    ON categories FOR SELECT
    USING (visible = true);

-- Products politikaları
CREATE POLICY "Platform adminler tüm ürünleri yönetebilir"
    ON products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

CREATE POLICY "Restaurant adminler kendi ürünlerini yönetebilir"
    ON products FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
        )
    );

CREATE POLICY "Herkes aktif ürünleri görebilir"
    ON products FOR SELECT
    USING (is_available = true);

-- AI Configs politikaları
CREATE POLICY "Platform adminler tüm AI configleri yönetebilir"
    ON ai_configs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

CREATE POLICY "Restaurant adminler kendi AI configlerini yönetebilir"
    ON ai_configs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
        )
    );

-- AI Conversations politikaları
CREATE POLICY "Restaurant adminler kendi konuşmalarını görebilir"
    ON ai_conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
        )
    );

-- Campaigns politikaları
CREATE POLICY "Platform adminler tüm kampanyaları yönetebilir"
    ON campaigns FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

CREATE POLICY "Restaurant adminler kendi kampanyalarını yönetebilir"
    ON campaigns FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
        )
    );

-- Analytics politikaları
CREATE POLICY "Restaurant adminler kendi analitiğini görebilir"
    ON analytics_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
        )
    );

-- Table Calls politikaları
CREATE POLICY "Restaurant adminler kendi masa çağrılarını yönetebilir"
    ON table_calls FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
        )
    );

-- QR Codes politikaları
CREATE POLICY "Platform adminler tüm QR kodları yönetebilir"
    ON qr_codes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

CREATE POLICY "Restaurant adminler kendi QR kodlarını yönetebilir"
    ON qr_codes FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
        )
    );

CREATE POLICY "Herkes aktif QR kodları okuyabilir"
    ON qr_codes FOR SELECT
    USING (status = 'active');

-- Orders politikaları
CREATE POLICY "Restaurant adminler kendi siparişlerini görüntüleyebilir"
    ON orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
        )
    );

CREATE POLICY "Restaurant adminler kendi siparişlerini güncelleyebilir"
    ON orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
        )
    );

CREATE POLICY "Herkes sipariş oluşturabilir"
    ON orders FOR INSERT
    WITH CHECK (true);

-- Order Items politikaları
CREATE POLICY "Restaurant adminler sipariş öğelerini görüntüleyebilir"
    ON order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM orders o
            JOIN restaurant_admins ra ON ra.restaurant_id = o.restaurant_id
            WHERE o.id = order_id AND ra.profile_id = auth.uid()
        )
    );

-- Reviews politikaları
CREATE POLICY "Restaurant adminler kendi yorumlarını yönetebilir"
    ON reviews FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
        )
    );

CREATE POLICY "Herkes yayınlanmış yorumları görebilir"
    ON reviews FOR SELECT
    USING (is_published = true);

CREATE POLICY "Herkes yorum oluşturabilir"
    ON reviews FOR INSERT
    WITH CHECK (true);

-- Loyalty Points politikaları
CREATE POLICY "Restaurant adminler kendi sadakat puanlarını yönetebilir"
    ON loyalty_points FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
        )
    );

-- Loyalty Transactions politikaları
CREATE POLICY "Restaurant adminler sadakat işlemlerini görüntüleyebilir"
    ON loyalty_transactions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM loyalty_points lp
            JOIN restaurant_admins ra ON ra.restaurant_id = lp.restaurant_id
            WHERE lp.id = loyalty_points_id AND ra.profile_id = auth.uid()
        )
    );

-- Loyalty Rewards politikaları
CREATE POLICY "Restaurant adminler kendi ödüllerini yönetebilir"
    ON loyalty_rewards FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = restaurant_id AND ra.profile_id = auth.uid()
        )
    );

CREATE POLICY "Herkes aktif ödülleri görebilir"
    ON loyalty_rewards FOR SELECT
    USING (is_active = true);

-- Loyalty Reward Redemptions politikaları
CREATE POLICY "Restaurant adminler ödül kullanımlarını görüntüleyebilir"
    ON loyalty_reward_redemptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM loyalty_points lp
            JOIN restaurant_admins ra ON ra.restaurant_id = lp.restaurant_id
            WHERE lp.id = loyalty_points_id AND ra.profile_id = auth.uid()
        )
    );

-- Webhook Configs politikaları
CREATE POLICY "Restaurant adminler kendi webhook ayarlarını yönetebilir"
    ON webhook_configs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = webhook_configs.restaurant_id
            AND ra.profile_id = auth.uid()
        )
    );

CREATE POLICY "Platform adminler tüm webhook ayarlarını görebilir"
    ON webhook_configs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

-- Webhook Logs politikaları
CREATE POLICY "Restaurant adminler kendi webhook loglarını görüntüleyebilir"
    ON webhook_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM restaurant_admins ra
            WHERE ra.restaurant_id = webhook_logs.restaurant_id
            AND ra.profile_id = auth.uid()
        )
    );

CREATE POLICY "Platform adminler tüm webhook loglarını görebilir"
    ON webhook_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'platform_admin'
        )
    );

-- ============================================================================
-- TRIGGER'LAR
-- ============================================================================

-- updated_at otomatik güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_configs_updated_at BEFORE UPDATE ON ai_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_conversations_updated_at BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_table_calls_updated_at BEFORE UPDATE ON table_calls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_qr_codes_updated_at BEFORE UPDATE ON qr_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_points_updated_at BEFORE UPDATE ON loyalty_points
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loyalty_rewards_updated_at BEFORE UPDATE ON loyalty_rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_webhook_configs_updated_at BEFORE UPDATE ON webhook_configs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED VERİLERİ
-- ============================================================================

-- NOT: Bu kullanıcıları oluşturmadan önce Supabase Auth'da manuel olarak oluşturmalısınız!
-- Aşağıdaki ID'ler örnek olarak verilmiştir. Gerçek kullanıcı ID'lerini kullanın.

-- Platform Admin (admin@veraqr.com)
-- Önce Supabase Dashboard > Authentication > Users'dan bu kullanıcıyı oluşturun
-- Email: admin@veraqr.com
-- Password: admin1
-- Kullanıcı oluşturulduktan sonra ID'sini alın ve aşağıdaki INSERT'e yerleştirin

-- Örnek Platform Admin profili
-- UYARI: Bu UUID'yi gerçek auth.users ID'si ile değiştirin!
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
    'b3906b21-7eb4-4251-b22d-51c015373ba5', -- Bu ID'yi gerçek auth.users.id ile değiştirin
    'admin@veraqr.com',
    'Platform Yöneticisi',
    'platform_admin',
    true
)
ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name;

-- Test restoranı oluştur
INSERT INTO restaurants (id, name, slug, description, primary_color, address, status, subscription_tier)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'Bella Italia Ristorante',
    'bella-italia',
    'Şehrin kalbinde otantik İtalyan mutfağı',
    '#C41E3A',
    'Via Roma 123, İstanbul',
    'active',
    'pro'
)
ON CONFLICT (id) DO NOTHING;

-- Test kategorileri
INSERT INTO categories (restaurant_id, name_tr, name_en, display_order)
VALUES
    ('10000000-0000-0000-0000-000000000001', 'Kahve', 'Coffee', 1),
    ('10000000-0000-0000-0000-000000000001', 'Tatlılar', 'Desserts', 2),
    ('10000000-0000-0000-0000-000000000001', 'Ana Yemekler', 'Main Courses', 3),
    ('10000000-0000-0000-0000-000000000001', 'İçecekler', 'Beverages', 4)
ON CONFLICT DO NOTHING;

-- Test ürünleri
INSERT INTO products (restaurant_id, category_id, name_tr, name_en, description_tr, description_en, price, ai_tags, is_available)
SELECT
    '10000000-0000-0000-0000-000000000001',
    c.id,
    item.name_tr,
    item.name_en,
    item.description_tr,
    item.description_en,
    item.price,
    item.ai_tags,
    true
FROM categories c
CROSS JOIN LATERAL (
    VALUES
        ('Espresso', 'Espresso', 'İtalyan tarzı espresso', 'Italian style espresso', 25.00, ARRAY['kahve', 'espresso', 'sıcak'], 1),
        ('Cappuccino', 'Cappuccino', 'Espresso, süt köpüğü ve tarçın', 'Espresso with milk foam and cinnamon', 35.00, ARRAY['kahve', 'süt', 'sıcak'], 1),
        ('Tiramisu', 'Tiramisu', 'Klasik İtalyan kahve aromalı tatlı', 'Classic Italian coffee-flavored dessert', 65.00, ARRAY['tatlı', 'kahve', 'mascarpone'], 2),
        ('Panna Cotta', 'Panna Cotta', 'Kremalı vanilya tatlısı', 'Creamy vanilla pudding', 55.00, ARRAY['tatlı', 'krema', 'vanilya'], 2),
        ('Margherita Pizza', 'Margherita Pizza', 'Domates sosu, mozzarella ve fesleğen', 'Tomato sauce, mozzarella and basil', 95.00, ARRAY['pizza', 'mozzarella', 'domates'], 3),
        ('Spaghetti Carbonara', 'Spaghetti Carbonara', 'Yumurta, peynir ve guanciale ile klasik Roma makarnası', 'Classic Roman pasta with eggs, cheese and guanciale', 85.00, ARRAY['makarna', 'yumurta', 'peynir'], 3),
        ('Limonata', 'Lemonade', 'Taze sıkılmış limon suyu', 'Freshly squeezed lemon juice', 30.00, ARRAY['içecek', 'limon', 'serinletici'], 4),
        ('Su', 'Water', 'Şişe su', 'Bottled water', 10.00, ARRAY['su', 'içecek'], 4)
) AS item(name_tr, name_en, description_tr, description_en, price, ai_tags, category_order)
WHERE c.restaurant_id = '10000000-0000-0000-0000-000000000001'
    AND c.display_order = item.category_order
ON CONFLICT DO NOTHING;

-- AI Config
INSERT INTO ai_configs (restaurant_id, personality, welcome_message_tr, welcome_message_en, custom_prompt, language)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    'professional',
    'Bella Italia Ristorante''ye hoş geldiniz! Size nasıl yardımcı olabilirim?',
    'Welcome to Bella Italia Ristorante! How can I help you?',
    'Sen Bella Italia Ristorante''nin AI asistanısın. Müşterilere yardımcı ol, menü hakkında bilgi ver ve sipariş almalarına yardım et.',
    'tr'
)
ON CONFLICT (restaurant_id) DO NOTHING;

-- QR Kodları (Masalar için)
INSERT INTO qr_codes (restaurant_id, table_number, qr_code_hash, location_description, status)
SELECT
    '10000000-0000-0000-0000-000000000001',
    'Masa ' || series::text,
    encode(gen_random_bytes(16), 'hex'),
    CASE
        WHEN series <= 5 THEN 'Ana Salon'
        WHEN series <= 8 THEN 'Teras'
        ELSE 'Özel Oda'
    END,
    'active'
FROM generate_series(1, 10) series
ON CONFLICT (restaurant_id, table_number) DO NOTHING;

-- Sadakat Ödülleri
INSERT INTO loyalty_rewards (restaurant_id, title, description, points_required, reward_type, reward_value, is_active)
VALUES
    (
        '10000000-0000-0000-0000-000000000001',
        'Ücretsiz Espresso',
        '100 puanla ücretsiz espresso kazanın',
        100,
        'free_item',
        '{"item_name": "Espresso"}'::jsonb,
        true
    ),
    (
        '10000000-0000-0000-0000-000000000001',
        '%10 İndirim',
        '200 puanla %10 indirim kazanın',
        200,
        'discount_percentage',
        '{"percentage": 10}'::jsonb,
        true
    ),
    (
        '10000000-0000-0000-0000-000000000001',
        'Ücretsiz Tatlı',
        '300 puanla ücretsiz tatlı kazanın',
        300,
        'free_item',
        '{"item_name": "Tiramisu"}'::jsonb,
        true
    )
ON CONFLICT DO NOTHING;

-- ============================================================================
-- YORUMLAR
-- ============================================================================

COMMENT ON TABLE profiles IS 'Kullanıcı profilleri - auth.users ile bağlantılı';
COMMENT ON TABLE restaurants IS 'Restoranlar - Platform''daki tenant''lar';
COMMENT ON TABLE restaurant_admins IS 'Restoran yöneticileri - profiles ve restaurants arasında ilişki';
COMMENT ON TABLE categories IS 'Menü kategorileri';
COMMENT ON TABLE products IS 'Menü ürünleri';
COMMENT ON TABLE ai_configs IS 'AI asistan konfigürasyonları';
COMMENT ON TABLE ai_conversations IS 'AI asistan konuşma geçmişi';
COMMENT ON TABLE campaigns IS 'Kampanyalar ve promosyonlar';
COMMENT ON TABLE analytics_events IS 'Analitik ve takip olayları';
COMMENT ON TABLE table_calls IS 'Masa çağrı sistemi';
COMMENT ON TABLE qr_codes IS 'Masa QR kodları';
COMMENT ON TABLE orders IS 'Müşteri siparişleri';
COMMENT ON TABLE order_items IS 'Sipariş öğeleri';
COMMENT ON TABLE reviews IS 'Müşteri yorumları ve değerlendirmeleri';
COMMENT ON TABLE loyalty_points IS 'Müşteri sadakat puanları';
COMMENT ON TABLE loyalty_transactions IS 'Sadakat puan işlemleri';
COMMENT ON TABLE loyalty_rewards IS 'Sadakat ödülleri';
COMMENT ON TABLE loyalty_reward_redemptions IS 'Ödül kullanımları';
COMMENT ON TABLE webhook_configs IS 'Webhook konfigürasyonları - Restoran entegrasyonları';
COMMENT ON TABLE webhook_logs IS 'Webhook delivery logları';

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
-- Add phone and email to restaurants table
ALTER TABLE restaurants
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS email VARCHAR(255);
