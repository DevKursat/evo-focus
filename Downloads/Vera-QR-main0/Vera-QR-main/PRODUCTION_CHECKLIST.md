# VERA QR - Production Deployment Checklist

## ✅ Tamamlanan Özellikler

### 🔐 Authentication & Security
- [x] Supabase Auth entegrasyonu
- [x] Platform admin ve restaurant admin rolleri
- [x] Row Level Security (RLS) policies
- [x] Middleware ile route koruması
- [x] Session tracking

### 👥 Platform Admin Panel
- [x] Dashboard (istatistikler)
- [x] Organization yönetimi (CRUD)
- [x] Yeni organization oluşturma
- [x] Logo upload
- [x] Brand color seçimi (10 preset + custom)
- [x] AI personality seçimi (5 option)
- [x] Çalışma saatleri ayarları

### 🍴 Restaurant Admin Panel
- [x] Dashboard (günlük istatistikler)
- [x] Menü kategorisi yönetimi
- [x] Menü item yönetimi (CRUD)
- [x] Image upload (Supabase storage)
- [x] Stok takibi
- [x] Alerjen yönetimi
- [x] Real-time sipariş takibi
- [x] Sipariş durum yönetimi
- [x] Masa yönetimi
- [x] QR kod oluşturma ve indirme
- [x] Garson çağrı sistemi (staff dashboard)

### 🤖 AI Features
- [x] AI assistant chat
- [x] AI personality integration (5 farklı karakter)
- [x] GPT-4o Vision API (menü okuma, yemek tanıma)
- [x] Auto-translation (10 dil desteği)
- [x] Context-aware chat

### 👨‍💼 Customer Features
- [x] QR kod ile menü erişimi
- [x] Sepet sistemi
- [x] Sipariş verme
- [x] AI assistant ile sohbet
- [x] Garson çağırma butonu
- [x] Çoklu dil desteği
- [x] Responsive tasarım

### 📊 Database
- [x] Organizations table
- [x] Admin users & Platform admins
- [x] Menu categories & items
- [x] Orders & order items
- [x] Tables & QR codes
- [x] Organization settings (AI, features)
- [x] Table calls
- [x] Loyalty points & transactions
- [x] Coupons
- [x] Reviews
- [x] Analytics events
- [x] AI conversations

### 🔗 API Endpoints
- [x] POST /api/orders (sipariş oluşturma)
- [x] POST /api/ai-chat (AI sohbet)
- [x] POST /api/ai-vision (görsel analiz)
- [x] POST /api/translate (çeviri)
- [x] GET /api/translate (desteklenen diller)
- [x] POST /api/table-calls (garson çağrı)
- [x] GET /api/table-calls (çağrı listesi)
- [x] POST /api/webhooks/crm (webhook entegrasyonu)

## ⚠️ Deployment Öncesi Yapılması Gerekenler

### 1. Dependencies Kurulumu
```bash
npm install
```

### 2. Environment Variables (.env.local)
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# OpenAI
OPENAI_API_KEY=your_openai_key

# App
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Supabase Configuration

#### Storage Buckets
1. **organizations** bucket oluştur
   - Public access: true
   - Allowed mime types: image/*
   - Max file size: 5MB

2. **menu-items** bucket oluştur
   - Public access: true
   - Allowed mime types: image/*
   - Max file size: 5MB

#### Database Migrations
```bash
# Supabase SQL Editor'de sırayla çalıştır:
1. supabase/migrations/20240101000000_initial_schema.sql
2. supabase/migrations/20240102000000_webhooks_and_crm.sql
3. supabase/migrations/20240103000000_auth_and_features.sql
4. supabase/migrations/20240103000001_rls_policies_extended.sql
```

#### RLS Policies
- Tüm RLS policies'in aktif olduğunu doğrula
- Test users ile erişim kontrollerini test et

### 4. İlk Platform Admin Oluşturma
```sql
-- Supabase SQL Editor'de çalıştır
-- Önce auth.users'da bir user oluştur (Supabase Dashboard > Authentication)
-- Sonra:
INSERT INTO platform_admins (user_id, is_super_admin)
VALUES ('auth-user-uuid-buraya', true);
```

### 5. Build Test
```bash
npm run build
```
Hataları kontrol et ve düzelt.

### 6. Test Checklist

#### Authentication Tests
- [ ] Platform admin login
- [ ] Restaurant admin login
- [ ] Logout
- [ ] Unauthorized route protection

#### Platform Admin Tests
- [ ] Dashboard görüntüleme
- [ ] Yeni organization oluşturma
- [ ] Logo upload
- [ ] Brand color değiştirme
- [ ] AI personality seçme
- [ ] Organization düzenleme
- [ ] Organization silme

#### Restaurant Admin Tests
- [ ] Dashboard görüntüleme
- [ ] Kategori ekleme/düzenleme/silme
- [ ] Item ekleme/düzenleme/silme
- [ ] Image upload
- [ ] Sipariş görüntüleme
- [ ] Sipariş durum değiştirme
- [ ] Real-time sipariş güncellemesi
- [ ] QR kod oluşturma
- [ ] QR kod indirme
- [ ] Garson çağrılarını görme
- [ ] Çağrı durumu değiştirme

#### Customer Tests
- [ ] QR kod tarama
- [ ] Menü görüntüleme
- [ ] Dil değiştirme
- [ ] AI assistant sohbet
- [ ] Sepete ekleme
- [ ] Sipariş verme
- [ ] Garson çağırma

#### AI Tests
- [ ] Chat yanıt alma
- [ ] Personality'ye uygun yanıt
- [ ] Vision API (menü fotoğrafı)
- [ ] Translation API

### 7. Performance Optimization
- [ ] Next.js image optimization aktif
- [ ] Static pages için ISR/SSG kullan
- [ ] API route'larını edge runtime'a geçir
- [ ] Supabase connection pooling kontrol

### 8. Monitoring & Analytics
- [ ] Error tracking (Sentry vb.)
- [ ] Analytics (Vercel Analytics, Google Analytics)
- [ ] Supabase query performance monitoring
- [ ] OpenAI API usage tracking

### 9. Security
- [ ] CORS ayarları
- [ ] Rate limiting (Vercel, Upstash Rate Limit)
- [ ] Input validation (Zod schemas)
- [ ] XSS protection
- [ ] CSRF protection

### 10. Documentation
- [ ] API documentation
- [ ] Admin user guide
- [ ] Customer user flow
- [ ] Troubleshooting guide

## 🚀 Deployment Steps

### Vercel Deployment
```bash
# Vercel CLI kurulu değilse
npm i -g vercel

# Deploy
vercel

# Production deploy
vercel --prod
```

### Environment Variables (Vercel Dashboard)
1. Settings > Environment Variables
2. Tüm .env.local değerlerini ekle
3. Production, Preview, Development için ayrı ayrı ayarla

### Domain Setup
1. Vercel Dashboard > Domains
2. Custom domain ekle
3. DNS ayarlarını yap

### Post-Deployment
1. Production URL'de tüm testleri tekrarla
2. SSL sertifikası kontrolü
3. Performance test (Lighthouse)
4. Mobile responsive test
5. Cross-browser test

## 📊 İsteğe Bağlı Özellikler (Post-Launch)

### Loyalty Program UI
- [ ] Müşteri puan gösterimi
- [ ] Puan kazanma kuralları
- [ ] Ödül kataloğu

### Coupon Management UI
- [ ] Kupon oluşturma
- [ ] Kupon listesi
- [ ] Kupon kullanım raporları

### Reviews Management
- [ ] Müşteri yorumları listesi
- [ ] Yorum yanıtlama
- [ ] Rating analizi

### Analytics Dashboard
- [ ] Satış grafikleri
- [ ] Popüler ürünler
- [ ] Peak hours analizi
- [ ] Müşteri davranış analizi

### Voice Features
- [ ] Speech-to-text (sipariş)
- [ ] Text-to-speech (AI yanıtlar)

### Advanced AI
- [ ] Menü optimizasyon önerileri
- [ ] Fiyatlandırma stratejisi
- [ ] Müşteri segmentasyonu

## 🔧 Troubleshooting

### Common Issues

**Build Errors**
```bash
# TypeScript errors
npm run type-check

# Linting
npm run lint

# Clean cache
rm -rf .next
npm run build
```

**Supabase Connection Issues**
- Check environment variables
- Verify RLS policies
- Check Supabase project status

**Image Upload Issues**
- Verify storage buckets exist
- Check bucket permissions
- Verify file size limits

**Real-time Issues**
- Check Supabase Realtime enabled
- Verify channel subscriptions
- Check network connection

## 📞 Support

- Documentation: [your-docs-url]
- Support Email: [your-email]
- GitHub Issues: [your-repo/issues]

---

**Version:** 1.0.0
**Last Updated:** 2024-01-03
**Status:** ✅ Production Ready (MVP)
