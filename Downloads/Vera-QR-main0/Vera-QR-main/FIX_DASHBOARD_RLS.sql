-- DASHBOARD VE REALTIME DÜZELTME SCRIPTI (DÜZELTİLMİŞ)
-- Bu scripti Supabase SQL Editor'da çalıştırın

-- 1. Tablo için RLS'yi (Satır Düzeyi Güvenlik) etkinleştir
ALTER TABLE waiter_calls ENABLE ROW LEVEL SECURITY;

-- 2. Eski politikaları temizle ve yenilerini ekle
DROP POLICY IF EXISTS "Enable read access for all users" ON waiter_calls;
CREATE POLICY "Enable read access for all users" ON waiter_calls FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON waiter_calls;
CREATE POLICY "Enable insert for all users" ON waiter_calls FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for all users" ON waiter_calls;
CREATE POLICY "Enable update for all users" ON waiter_calls FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public insert to waiter_calls" ON waiter_calls;
DROP POLICY IF EXISTS "Allow public select for waiter_calls" ON waiter_calls;

-- 3. REALTIME ETKİNLEŞTİRME (Hata korumalı)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE waiter_calls;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN OTHERS THEN NULL;
  END;
END $$;

-- 4. SONUÇLARI KONTROL ET
SELECT * FROM waiter_calls ORDER BY created_at DESC LIMIT 5;
