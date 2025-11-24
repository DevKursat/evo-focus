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
