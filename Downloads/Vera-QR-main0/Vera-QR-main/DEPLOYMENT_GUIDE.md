# VERA QR - Deployment Rehberi

## 📋 Genel Bakış

VERA QR, restoranlar için tam özellikli, AI destekli dijital menü SaaS platformudur. Bu rehber, projenin Supabase ve Vercel'de nasıl deploy edileceğini açıklar.

## 🗄️ Supabase Kurulumu

### 1. Yeni Proje Oluşturma

1. [Supabase Dashboard](https://app.supabase.com)'a gidin
2. "New Project" butonuna tıklayın
3. Proje bilgilerini girin:
   - Project Name: `vera-qr-production`
   - Database Password: Güçlü bir şifre oluşturun
   - Region: Size en yakın bölgeyi seçin (örn: Frankfurt)

### 2. Veritabanı Şemasını Yükleme

1. Supabase Dashboard'da **SQL Editor** bölümüne gidin
2. `supabase/schema.sql` dosyasının içeriğini kopyalayın
3. SQL Editor'a yapıştırın ve **RUN** butonuna tıklayın

Bu işlem:
- ✅ 18 tablo oluşturur
- ✅ RLS politikalarını ayarlar
- ✅ İndexleri ve trigger'ları ekler
- ✅ Test verilerini yükler (Bella Italia restoranı)

### 3. Storage Bucket Oluşturma

Logo ve ürün görselleri için storage bucket oluşturun:

1. **Storage** bölümüne gidin
2. **New Bucket** butonuna tıklayın
3. Bucket bilgilerini girin:
   - Name: `organizations`
   - Public: ✅ (Logoların görünebilmesi için)

### 4. Platform Admin Kullanıcısı Oluşturma

#### Adım 1: Auth Kullanıcısı Oluşturma

1. **Authentication** > **Users** bölümüne gidin
2. **Add User** > **Create New User** seçin
3. Bilgileri girin:
   ```
   Email: admin@veraqr.com
   Password: [güçlü bir şifre]
   Auto Confirm User: ✅
   ```
4. **Create User** butonuna tıklayın
5. **Oluşturulan kullanıcının UUID'sini kopyalayın** (örn: `123e4567-e89b-12d3-a456-426614174000`)

#### Adım 2: Profile Oluşturma

1. **SQL Editor**'e gidin
2. Aşağıdaki SQL'i çalıştırın (UUID'yi değiştirin):

```sql
INSERT INTO profiles (id, email, full_name, role, is_active)
VALUES (
    '123e4567-e89b-12d3-a456-426614174000', -- Yukarıda kopyaladığınız UUID
    'admin@veraqr.com',
    'Platform Yöneticisi',
    'platform_admin',
    true
);
```

### 5. API Keys

**Project Settings** > **API** bölümünden aşağıdaki bilgileri alın:

- **Project URL**: `https://xxxxx.supabase.co`
- **Anon/Public Key**: `eyJhbGc...` (Public için kullanılır)
- **Service Role Key**: `eyJhbGc...` (Server-side işlemler için)

## 🚀 Vercel Deployment

### 1. Repository Hazırlama

Projenizi GitHub'a push edin:

```bash
git add .
git commit -m "Ready for production"
git push origin main
```

### 2. Vercel'de Proje Oluşturma

1. [Vercel Dashboard](https://vercel.com/dashboard)'a gidin
2. **Add New Project** > **Import Git Repository**
3. GitHub repository'nizi seçin: `DevKursat/Vera-QR`
4. **Import** butonuna tıklayın

### 3. Environment Variables

**Environment Variables** bölümünde aşağıdaki değişkenleri ekleyin:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# App
NEXT_PUBLIC_APP_URL=https://veraqr.com

# OpenAI (Opsiyonel - Platform varsayılanı için)
OPENAI_API_KEY=sk-...

# Google Maps (Opsiyonel - Adres autocomplete için)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

### 4. Build Settings

Vercel otomatik olarak algılayacaktır, ama kontrol edin:

```
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
```

### 5. Deploy

**Deploy** butonuna tıklayın! 🚀

İlk deployment 2-3 dakika sürecektir.

## ✅ Deployment Sonrası Kontroller

### 1. Admin Paneline Giriş Testi

1. `https://your-domain.vercel.app/auth/login` adresine gidin
2. Platform admin bilgileri ile giriş yapın:
   ```
   Email: admin@veraqr.com
   Password: [oluşturduğunuz şifre]
   ```
3. `/admin/dashboard` sayfasına yönlendirilmelisiniz ✅

### 2. Yeni İşletme Ekleme Testi

1. `/admin/organizations/new` sayfasına gidin
2. Test işletmesi oluşturun:
   - İşletme Adı: "Test Cafe"
   - Slug: `test-cafe` (otomatik oluşur)
   - AI Kişiliği: Samimi
3. **İşletme Oluştur** butonuna tıklayın
4. Başarı mesajı görmelisiniz ✅

### 3. Dinamik Menü Sayfası Testi

1. `https://your-domain.vercel.app/bella-italia` adresine gidin
2. Menü sayfası görünmelidir (seed verilerinden)
3. Kategoriler ve ürünler listelenmelidir ✅

### 4. QR Kod Testi

1. Admin panelinde bir QR kod bulun
2. Mobil cihazdan QR kodu okutun
3. Doğru menü sayfasına yönlendirilmelisiniz ✅

## 🔧 Üretim Ayarları

### Supabase Rate Limiting

**Project Settings** > **API**:
- Rate limiting'i aktif edin
- Varsayılan: 100 requests/second

### Supabase Backup

**Database** > **Backups**:
- Otomatik günlük backup aktif
- Point-in-time recovery etkin

### Vercel Analytics

**Analytics** sekmesinden:
- Web Analytics aktif edin
- Speed Insights aktif edin

### Domain Ayarları

**Settings** > **Domains**:
1. Özel domain ekleyin: `veraqr.com`
2. DNS kayıtlarını ayarlayın (A record veya CNAME)
3. SSL sertifikası otomatik oluşturulacak

## 📊 İzleme ve Monitoring

### Supabase Monitoring

**Project Settings** > **Usage**:
- Database boyutu
- API istekleri
- Bandwidth kullanımı
- Storage kullanımı

### Vercel Analytics

**Analytics** sekmesi:
- Sayfa görüntüleme
- Kullanıcı metrikleri
- Performance skorları

### Error Tracking

Supabase **Logs**:
- Database errors
- API errors
- Auth errors

Vercel **Runtime Logs**:
- Build errors
- Function errors
- Server errors

## 🆘 Sorun Giderme

### "Failed to fetch" Hatası

**Sebep**: CORS hatası  
**Çözüm**: Supabase **Authentication** > **URL Configuration**'da domain'inizi ekleyin

### "Invalid API Key" Hatası

**Sebep**: Yanlış environment variable  
**Çözüm**: Vercel environment variables'ı kontrol edin

### "Row Level Security" Hatası

**Sebep**: RLS policy'leri eksik  
**Çözüm**: `schema.sql` dosyasını tekrar çalıştırın

### Build Hatası

**Sebep**: TypeScript veya dependency hatası  
**Çözüm**: 
```bash
npm install
npm run build
```
Local'de test edin, sonra deploy edin

## 📱 Test Kullanıcıları

### Platform Admin
```
Email: admin@veraqr.com
Password: [sizin belirlediğiniz]
Erişim: /admin/dashboard
```

### Restaurant Admin (Örnek)

Henüz yok. Platform admin olarak:
1. Yeni restaurant oluşturun
2. Restaurant admin kullanıcısı oluşturun
3. `restaurant_admins` tablosuna ekleyin

## 🔐 Güvenlik Kontrol Listesi

- [x] Supabase RLS tüm tablolarda aktif
- [x] Environment variables Vercel'de güvenli
- [x] API keys gizli (`.env.local` gitignore'da)
- [x] HTTPS zorunlu (Vercel otomatik)
- [x] Auth session güvenli
- [x] File upload size limiti (2MB)
- [x] Rate limiting aktif
- [ ] 2FA admin hesaplarda aktif (manuel yapın)

## 📞 Destek

Herhangi bir sorun yaşarsanız:

1. **Supabase Logs** kontrol edin
2. **Vercel Runtime Logs** kontrol edin
3. GitHub Issues açın
4. [Supabase Discord](https://discord.supabase.com) topluluğuna katılın

## 🎉 Tebrikler!

VERA QR platformunuz artık canlıda! 

Sonraki adımlar:
- ✅ İlk müşteri restoranını ekleyin
- ✅ OpenAI API key ekleyin (AI asistan için)
- ✅ Google Maps API key ekleyin (adres autocomplete için)
- ✅ Özel domain ayarlayın
- ✅ Marketing'e başlayın!
