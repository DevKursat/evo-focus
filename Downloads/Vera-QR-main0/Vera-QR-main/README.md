# 🍽️ VERAQR - AI-Powered Restaurant Management Platform

<div align="center">

**Complete Multi-Tenant SaaS for Modern Restaurants**

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Powered-green)](https://supabase.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-orange)](https://openai.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[🚀 Quick Start](#-quick-start) • [✨ Features](#-features) • [📚 Documentation](#-documentation) • [🛠️ Tech Stack](#️-tech-stack)

</div>

---

## 🎯 What is VERA QR?

VERA QR is a **production-ready** multi-tenant restaurant management platform that combines:

- 📱 **QR-based digital menus** - Contactless ordering experience
- 🤖 **AI Assistant (GPT-4)** - 24/7 customer support & recommendations  
- 👨‍💼 **Admin Dashboard** - Complete restaurant & menu management
- 🔔 **Real-time Notifications** - Live order & table call alerts
- 🌍 **Multi-language** - Auto-translate menus to 10+ languages
- 💳 **Loyalty & Coupons** - Customer retention tools
- 📊 **Analytics** - Sales insights & performance tracking

**Perfect for:** Restaurants, Cafes, Bars, Food Courts, Cloud Kitchens

---

## ✨ Features

### 🤖 AI-Powered Intelligence
- **GPT-4 Chat Assistant** with 5 personality types (Friendly, Professional, Fun, Formal, Casual)
- **Vision API** for menu photo recognition
- **Smart Recommendations** based on customer preferences
- **Auto-Translation** to 10+ languages
- **Per-Restaurant API Keys** - Each restaurant can use their own OpenAI key

### 👨‍💼 Platform Admin Panel
- Multi-tenant dashboard to manage unlimited restaurants
- Organization CRUD with branding (logo, colors, slug)
- Feature toggles per restaurant
- Platform-wide analytics

### 🍴 Restaurant Admin Panel
- **Dashboard**: Real-time sales, orders, revenue
- **Menu Management**: Categories, items, photos, pricing, stock
- **Orders**: Live tracking with status updates & audio alerts
- **Tables & QR**: Generate branded QR codes for tables
- **Reviews**: Rating system with admin responses
- **Loyalty Program**: Points tracking & top customers
- **Coupons**: Discount codes with usage tracking
- **Analytics**: Sales charts, top items, peak hours

### 📱 Customer Experience
- Scan QR → Instant menu access
- AI chat for help & recommendations
- Multi-language menu viewing
- Smart cart & checkout
- Order tracking in real-time
- Table call button for service

---

## 🚀 Quick Start

### 📋 Prerequisites
- Node.js 18+
- Supabase account (free)
- OpenAI API key ($5 minimum)

### ⚡ 3-Minute Setup

```bash
# 1. Clone repository
git clone https://github.com/DevKursat/Vera-QR.git
cd Vera-QR

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.local.example .env.local

# 4. Edit .env.local with your keys
# (Get keys from Supabase & OpenAI)

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) 🎉

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[QUICKSTART.md](QUICKSTART.md)** | 5-minute deployment guide (Supabase + Vercel) |
| **[DEPLOYMENT.md](DEPLOYMENT.md)** | Detailed production deployment steps |
| **[FEATURES_COMPLETE.md](FEATURES_COMPLETE.md)** | Complete feature list with screenshots |
| **[PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md)** | Pre-launch checklist |

### 🗄️ Database Setup

1. Create Supabase project at [supabase.com](https://supabase.com)
2. Open **SQL Editor**
3. Run **`supabase/migrations/00_complete_schema.sql`** (single file!)
4. Create storage buckets: `organizations` & `menu-items` (public)
5. Done! ✅

**One SQL file contains:**
- 16 tables with relationships
- 40+ optimized indexes
- 20+ RLS security policies
- Triggers & functions
- Safe to run multiple times (uses `IF NOT EXISTS`)

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - App Router, Server Components, API Routes
- **TypeScript 5** - Full type safety
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible UI components
- **Lucide Icons** - Beautiful icons

### Backend
- **Supabase** - PostgreSQL database with Realtime subscriptions
- **Supabase Auth** - JWT-based authentication
- **Supabase Storage** - Image uploads (logos, menu photos)
- **Row Level Security** - Multi-tenant data isolation

### AI & APIs
- **OpenAI GPT-4o** - AI chat assistant
- **OpenAI GPT-4o-mini** - Cost-effective AI tasks
- **OpenAI Vision API** - Image recognition
- **Google Places API** - Address autocomplete (optional)

### DevOps
- **Vercel** - Deployment platform
- **Git** - Version control
- **ESLint** - Code linting

---

## 📂 Project Structure

```
veraqr/
├── app/                          # Next.js 14 App Router
│   ├── [slug]/                   # Customer menu pages (dynamic)
│   ├── admin/                    # Platform admin panel
│   ├── dashboard/                # Restaurant admin panel
│   ├── auth/                     # Authentication pages
│   └── api/                      # API routes
│       ├── ai-chat/              # AI assistant endpoint
│       ├── orders/               # Order management
│       └── webhooks/             # Webhook integrations
├── components/
│   ├── admin/                    # Platform admin components
│   ├── restaurant/               # Restaurant admin components
│   ├── customer/                 # Customer-facing components
│   └── ui/                       # Reusable UI components
├── lib/
│   ├── supabase/                 # Supabase client & types
│   ├── openai.ts                 # OpenAI integration
│   └── utils.ts                  # Helper functions
├── supabase/
│   └── migrations/
│       └── 00_complete_schema.sql  # Single migration file
└── public/                       # Static assets
```

---

## �� Deployment

### Deploy to Vercel (3 clicks)

1. Push to GitHub
2. Import to [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy! 🚀

**Environment Variables:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_APP_URL=https://your-domain.com
PLATFORM_ADMIN_EMAIL=admin@yourcompany.com
```

**GitHub Actions (Health Check):**
- Add `APP_URL` secret in repository settings
- Health checks run every 5 minutes automatically
- Verifies Supabase connection & system status

See [QUICKSTART.md](QUICKSTART.md) for step-by-step guide.

---

## 🎨 Features Overview

### Customer Flow
```
1. Scan QR Code → 2. View Menu → 3. Chat with AI → 4. Add to Cart → 5. Place Order → 6. Track Status
```

### Restaurant Admin Flow
```
1. Login → 2. Manage Menu → 3. Generate QR Codes → 4. Receive Orders → 5. Update Status → 6. View Analytics
```

### Platform Admin Flow
```
1. Login → 2. Create Restaurant → 3. Configure Features → 4. Monitor Analytics
```

---

## 🔐 Security

- ✅ **Row Level Security (RLS)** - Database-level access control
- ✅ **Multi-tenant Architecture** - Complete data isolation per restaurant
- ✅ **JWT Authentication** - Secure token-based auth
- ✅ **API Key Management** - Per-restaurant OpenAI keys
- ✅ **Input Validation** - Zod schema validation
- ✅ **SQL Injection Protection** - Parameterized queries

---

## 📊 Database Schema

**16 Core Tables:**
- `organizations` - Restaurant accounts
- `menu_categories` - Menu sections
- `menu_items` - Food & drink items
- `tables` - Physical tables with QR codes
- `orders` - Customer orders
- `reviews` - Customer ratings & feedback
- `customer_loyalty` - Loyalty program members
- `coupons` - Discount codes
- `ai_conversations` - Chat logs
- `webhook_endpoints` - Integration webhooks
- `analytics_events` - User behavior tracking
- ... and more

See [00_complete_schema.sql](supabase/migrations/00_complete_schema.sql) for full schema.

---

## 🤝 Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 🙏 Acknowledgments

Built with amazing open-source technologies:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [OpenAI](https://openai.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)

---

## 📞 Support

- 📧 Email: support@veraqr.com
- 🐛 Issues: [GitHub Issues](https://github.com/DevKursat/Vera-QR/issues)
- 📖 Docs: See [QUICKSTART.md](QUICKSTART.md)

---

<div align="center">

**⭐ Star this repo if you find it useful!**

Made with ❤️ for the restaurant industry

</div>
