# 🗺️ VERA-QR Navigasyon Rehberi

## 🏠 Ana Sayfa
- **URL:** `http://localhost:3000/` veya domain
- Landing page (pazarlama sayfası)
- Linkler:
  - Giriş Yap → `/auth/login`
  - Ücretsiz Dene → `/admin/register` (henüz yok, login'e yönlendir)

---

## 🔐 GİRİŞ YAPMA

### Admin/Restoran Giriş
- **URL:** `http://localhost:3000/auth/login`
- **Tek sayfa** - hem platform admin hem restoran admin aynı yerden giriş yapar
- Giriş sonrası otomatik yönlendirme:
  - **Platform Admin** → `/admin/dashboard`
  - **Restoran Admin** → `/dashboard`

---

## 🎯 PLATFORM ADMİN PANELİ (Süper Admin)

### Ana Dashboard
- **URL:** `http://localhost:3000/admin/dashboard`
- Tüm platformu yöneten kişi buraya düşer
- Burada olması gereken:
  - Tüm organizasyonları görme/yönetme
  - Yeni restoran ekleme
  - Platform geneli istatistikler

### Organizasyonlar
- **URL:** `http://localhost:3000/admin/organizations`
- Tüm restoranları listele
- **Yeni Ekle:** `http://localhost:3000/admin/organizations/new`

---

## 🍴 RESTORAN ADMİN PANELİ (Restoran Sahibi/Yönetici)

### Dashboard (Ana Sayfa)
- **URL:** `http://localhost:3000/dashboard`
- Günlük satış, sipariş, gelir özetleri

### Menü Yönetimi
- **Ana:** `http://localhost:3000/dashboard/menu`
- **Yeni Ürün:** `http://localhost:3000/dashboard/menu/items/new`
- Kategoriler ve ürünler buradan yönetilir

### Siparişler
- **URL:** `http://localhost:3000/dashboard/orders`
- Canlı sipariş takibi
- Durum güncelleme (hazırlanıyor, hazır, teslim edildi)

### Masalar & QR Kodlar
- **URL:** `http://localhost:3000/dashboard/tables`
- Masa ekle/düzenle
- QR kod oluştur/yazdır

### Müşteri Çağrıları
- **URL:** `http://localhost:3000/dashboard/calls`
- Müşterilerin garson çağırma bildirimleri

### Yorumlar
- **URL:** `http://localhost:3000/dashboard/reviews`
- Müşteri değerlendirmeleri
- Yanıt yazma

### Sadakat Programı
- **URL:** `http://localhost:3000/dashboard/loyalty`
- Puan toplayan müşterileri görme
- En sadık müşteriler listesi

### Kuponlar
- **URL:** `http://localhost:3000/dashboard/coupons`
- İndirim kuponları oluşturma
- Kullanım takibi

### Analizler
- **URL:** `http://localhost:3000/dashboard/analytics`
- Satış grafikleri
- Popüler ürünler
- Yoğun saatler

---

## 👥 MÜŞTERİ TARAFINDA (QR Okutma)

### Dinamik Menü Sayfası
- **URL:** `http://localhost:3000/{restaurant-slug}`
- Örnek: `http://localhost:3000/karadeniz-restaurant`
- Müşteri QR kodu okutunca bu sayfaya düşer
- Burada:
  - Menüyü görür
  - AI asistanla konuşur
  - Sipariş verir
  - Garson çağırır

### Slug Nasıl Oluşuyor?
- Platform admin restoran eklerken slug belirlenir
- Örnek: "Karadeniz Restaurant" → `karadeniz-restaurant`

---

## ⚡ HIZLI ERİŞİM LİNKLERİ

Projeyi local'de çalıştırdıysan:

| Sayfa | URL |
|-------|-----|
| Ana sayfa | http://localhost:3000 |
| Giriş | http://localhost:3000/auth/login |
| Platform Admin | http://localhost:3000/admin/dashboard |
| Restoran Dashboard | http://localhost:3000/dashboard |
| Menü Yönetimi | http://localhost:3000/dashboard/menu |
| Siparişler | http://localhost:3000/dashboard/orders |
| Masalar | http://localhost:3000/dashboard/tables |
| Analizler | http://localhost:3000/dashboard/analytics |

---

## 🔑 İLK GİRİŞ NASIL YAPILIR?

### 1. Database'e Test Kullanıcısı Ekle

Supabase SQL Editor'de şunu çalıştır:

```sql
-- Platform admin oluştur (süper admin)
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@veraqr.com',
  crypt('admin123', gen_salt('bf')), -- şifre: admin123
  NOW(),
  NOW(),
  NOW()
);

-- Platform admins tablosuna ekle
INSERT INTO platform_admins (
  auth_user_id,
  email,
  full_name,
  is_super_admin
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@veraqr.com'),
  'admin@veraqr.com',
  'Süper Admin',
  true
);
```

### 2. Giriş Yap
- `http://localhost:3000/auth/login`
- Email: `admin@veraqr.com`
- Şifre: `admin123`

### 3. İlk Restoran Oluştur
- Platform admin panelinde → Organizations → New
- Restoran bilgilerini gir
- Slug belirle (örn: `test-restaurant`)

### 4. Restoran Admin Oluştur (SQL)

```sql
-- Restoran admin kullanıcısı
INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'restoran@example.com',
  crypt('restoran123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
);

-- Admin_users tablosuna ekle
INSERT INTO admin_users (
  auth_user_id,
  email,
  full_name,
  role,
  organization_id
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'restoran@example.com'),
  'restoran@example.com',
  'Restoran Yöneticisi',
  'owner',
  'YOUR_ORGANIZATION_ID' -- Platform admin panelinden kopyala
);
```

---

## 🎨 SIDEBAR MENÜLER

### Platform Admin Sidebar
- Dashboard
- Organizations (restoranlar)
- Analytics
- Settings

### Restoran Admin Sidebar
- Dashboard
- Menü
- Siparişler
- Masalar
- Çağrılar
- Yorumlar
- Sadakat
- Kuponlar
- Analizler
- Ayarlar

---

## 📱 MOBİL KULLANIM

Tüm paneller responsive:
- Tablet & Mobile için hamburger menu
- QR menü sayfası tamamen mobil optimize

---

## ❓ SIKÇA SORULAN

**S: Giriş yapınca hata veriyor?**
A: Database'de platform_admins veya admin_users tablosunda kullanıcı var mı kontrol et.

**S: Restoran menüsü nerede?**
A: `/{slug}` örnek: `/karadeniz-restaurant`

**S: Admin paneli boş görünüyor?**
A: Henüz veri yok, önce organizasyon oluştur.

**S: QR kod nerede üretiliyor?**
A: Restoran admin → Tables → Her masa için QR indir/yazdır

---

Daha fazla bilgi için:
- README.md
- QUICKSTART.md
- FEATURES_COMPLETE.md
