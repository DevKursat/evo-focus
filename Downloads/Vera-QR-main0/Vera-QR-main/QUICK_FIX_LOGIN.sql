-- 🚨 HEMEN ÇÖZ: Login Sorunu
-- Supabase SQL Editor'da çalıştır:

-- 1️⃣ Kullanıcı var mı kontrol et
SELECT id, email, created_at, confirmed_at 
FROM auth.users 
WHERE email = 'admin@veraqr.com';

-- 2️⃣ Platform admin kaydı var mı kontrol et
SELECT pa.*, au.email as auth_email
FROM platform_admins pa
LEFT JOIN auth.users au ON pa.user_id = au.id
WHERE pa.email = 'admin@veraqr.com';

-- 3️⃣ EĞER KULLANICI YOKSA (yukarıdaki boş dönerse):
-- Not: Şifre: admin1234 (daha güvenli)
-- Supabase Dashboard > Authentication > Users > "Add User" butonuna tıkla
-- Email: admin@veraqr.com
-- Password: admin1234
-- Auto Confirm: YES (✓)
-- "Add User" butonuna tıkla

-- 4️⃣ Kullanıcı ID'sini al ve platform admin ekle:
-- (Önce yukarıdaki 1️⃣ sorguyu çalıştır ve ID'yi kopyala)

-- ÖRNEK (user_id'yi kendi ID'n ile değiştir):
INSERT INTO platform_admins (user_id, email, full_name, is_super_admin, permissions)
VALUES (
  'BURAYA-USER-ID-YAPISTIR',  -- 1️⃣'den aldığın ID
  'admin@veraqr.com',
  'Platform Administrator',
  true,
  '["all"]'::jsonb
)
ON CONFLICT (email) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  is_super_admin = true;

-- 5️⃣ Doğrulama - Her iki tablo da dolu olmalı:
SELECT 
  au.id as user_id,
  au.email as auth_email,
  pa.id as platform_admin_id,
  pa.full_name,
  pa.is_super_admin
FROM auth.users au
LEFT JOIN platform_admins pa ON pa.user_id = au.id
WHERE au.email = 'admin@veraqr.com';

-- ✅ Beklenen Sonuç:
-- user_id: bir UUID
-- auth_email: admin@veraqr.com
-- platform_admin_id: bir UUID
-- full_name: Platform Administrator
-- is_super_admin: true

-- 🎯 EĞER HERHANGİ BİR ALAN NULL ise, o adımı tekrar yap!

-- 📝 NOT: Supabase Dashboard'dan kullanıcı eklersen:
-- 1. Authentication > Users > Add User
-- 2. Email: admin@veraqr.com
-- 3. Password: admin1234
-- 4. Auto Confirm User: YES ✓
-- 5. Add User butonuna tıkla
-- 6. User ID'yi kopyala
-- 7. Yukarıdaki INSERT INTO platform_admins sorgusunu çalıştır (USER ID'yi değiştir)
