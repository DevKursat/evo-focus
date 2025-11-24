-- ============================================================================
-- VERA QR - TAMAMEN TEMİZLEME SQL SCRIPT
-- ============================================================================
-- UYARI: Bu script tüm tabloları, bucket'ları ve verileri SİLER!
-- Sadece yeni bir başlangıç yapmak istiyorsanız çalıştırın!
-- ============================================================================

-- 1. STORAGE BUCKET'LARINI SİL
-- ============================================================================

DO $$ 
DECLARE 
    bucket_record RECORD;
BEGIN
    FOR bucket_record IN 
        SELECT id FROM storage.buckets
    LOOP
        -- Bucket içindeki tüm dosyaları sil
        DELETE FROM storage.objects WHERE bucket_id = bucket_record.id;
        -- Bucket'ı sil
        DELETE FROM storage.buckets WHERE id = bucket_record.id;
    END LOOP;
END $$;

-- 2. TABLO SİLME İŞLEMLERİ (CASCADE ile bağımlılıkları da siler)
-- ============================================================================

-- AI ve Konuşma tabloları
DROP TABLE IF EXISTS ai_conversations CASCADE;
DROP TABLE IF EXISTS ai_configs CASCADE;

-- Sadakat programı tabloları
DROP TABLE IF EXISTS loyalty_reward_redemptions CASCADE;
DROP TABLE IF EXISTS loyalty_rewards CASCADE;
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS loyalty_points CASCADE;

-- Yorum ve değerlendirme tabloları
DROP TABLE IF EXISTS reviews CASCADE;

-- Sipariş tabloları
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- QR ve masa tabloları
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS table_calls CASCADE;
DROP TABLE IF EXISTS tables CASCADE;

-- Kampanya ve analitik tabloları
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS analytics_events CASCADE;

-- Webhook tabloları
DROP TABLE IF EXISTS webhook_logs CASCADE;
DROP TABLE IF EXISTS webhook_endpoints CASCADE;

-- Menü tabloları
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS menu_categories CASCADE;

-- Restoran ve admin tabloları
DROP TABLE IF EXISTS restaurant_admins CASCADE;
DROP TABLE IF EXISTS restaurants CASCADE;
DROP TABLE IF EXISTS organization_settings CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Kullanıcı ve profil tabloları
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS platform_admins CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 3. FONKSİYONLARI SİL
-- ============================================================================

DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- 4. TRİGGERLARI SİL (CASCADE ile otomatik silinir ama yine de)
-- ============================================================================

-- Triggers tablolarla birlikte silinir, ek işlem gerekmez

-- 5. POLİTİKALARI SİL (CASCADE ile otomatik silinir)
-- ============================================================================

-- RLS policies tablolarla birlikte silinir

-- 6. EXTENSION'LARI KONTROL ET (Silmeyin, diğer projeler kullanabilir)
-- ============================================================================

-- Aşağıdaki extension'ları silmek istemiyoruz çünkü başka projeler kullanabilir:
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "pg_trgm";
-- DROP EXTENSION IF EXISTS "postgis";

-- ============================================================================
-- TEMİZLEME TAMAMLANDI
-- ============================================================================

-- Onay mesajı
DO $$ 
BEGIN 
    RAISE NOTICE '✅ Tüm tablolar, bucket''lar ve veriler başarıyla silindi!';
    RAISE NOTICE '📝 Şimdi schema.sql dosyasını çalıştırabilirsiniz.';
END $$;
