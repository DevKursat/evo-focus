# 🚀 PRODUCTION DEPLOYMENT CHECKLIST

## ✅ Pre-Deployment Checklist

### Database Setup
- [ ] Supabase project created
- [ ] Run migration: `supabase/migrations/00_complete_schema.sql`
- [ ] Verify all tables created with RLS policies
- [ ] Create initial platform admin user:
  ```sql
  -- Get your auth.uid after signup
  SELECT id, email FROM auth.users;
  
  -- Insert platform admin record
  INSERT INTO platform_admins (user_id, email, full_name, is_super_admin)
  VALUES ('your-auth-uid', 'admin@veraqr.com', 'Platform Admin', true);
  ```

### Environment Variables
- [ ] Copy `.env.example` to `.env.local`
- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)
- [ ] Set `OPENAI_API_KEY` (optional, for AI features)
- [ ] Set `NEXT_PUBLIC_APP_URL` (your domain)

### Vercel Deployment
- [ ] Connect GitHub repository to Vercel
- [ ] Configure environment variables in Vercel dashboard
- [ ] Enable Vercel Cron Jobs for webhook retries (optional)
- [ ] Set up custom domain (optional)

### Security Checks
- [ ] All API routes use `createClient()` from `@/lib/supabase/server`
- [ ] RLS policies enabled on all tables
- [ ] Webhook endpoints validate secret keys
- [ ] No sensitive data in client-side code

### Feature Testing
- [ ] Login page works (admin@veraqr.com)
- [ ] Platform admin dashboard loads
- [ ] Create test organization
- [ ] Add menu categories and items
- [ ] Generate QR code for table
- [ ] Test customer ordering flow
- [ ] Verify AI chat (if OpenAI key configured)
- [ ] Test webhook endpoints (optional)

## 🔧 Post-Deployment Tasks

### Initial Setup
1. **Login as Platform Admin**
   - Navigate to `/auth/login`
   - Use credentials: `admin@veraqr.com` / (your password)
   - Verify dashboard loads: `/admin/dashboard`

2. **Create First Organization**
   - Go to Organizations → Create New
   - Fill: Name, Slug (URL-friendly), Logo, Brand Color
   - Save and note the Organization ID

3. **Setup Restaurant Admin**
   - Go to Admin Users → Create New
   - Assign user to organization
   - Set role: `restaurant_admin`
   - User can now login and manage restaurant

4. **Configure Menu**
   - Login as restaurant admin
   - Create categories (Appetizers, Main Course, etc.)
   - Add menu items with prices, descriptions
   - Upload images (recommended)

5. **Setup Tables**
   - Go to Tables → Add New
   - Enter table number and location
   - System auto-generates QR code
   - Download QR codes for printing

6. **Optional: AI Setup**
   - Go to Organization Settings
   - Enter OpenAI API key (organization-specific)
   - Choose AI personality (Friendly/Professional/etc)
   - Enable AI chat, translations, vision

## 🧪 Testing Scenarios

### Customer Flow
1. Scan QR code → Menu loads
2. Browse categories and items
3. Add items to cart
4. Place order → Order appears in admin panel
5. Request table service → Notification sent

### Admin Flow
1. Login → Dashboard shows stats
2. View pending orders
3. Update order status (Preparing → Ready → Served)
4. Respond to table calls
5. Check analytics

### AI Features (Optional)
1. Customer opens menu → AI chat available
2. Ask "What do you recommend?" → AI suggests dishes
3. Ask in different language → AI responds accordingly
4. Upload menu photo → AI extracts items

## 🐛 Common Issues & Fixes

### Issue: "Missing Supabase environment variables"
**Fix:** Ensure `.env.local` has all required variables, restart dev server

### Issue: "Bu hesapla giriş yapamazsınız" (Cannot login)
**Fix:** Verify `platform_admins` table has record with correct `user_id`
```sql
SELECT * FROM platform_admins WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@veraqr.com');
```

### Issue: Login redirect stuck
**Fix:** Clear browser cookies, check middleware logs, verify RLS policies

### Issue: Orders not showing
**Fix:** Check `organizations.status = 'active'`, verify RLS policies allow access

### Issue: AI features not working
**Fix:** Verify `OPENAI_API_KEY` is set, check API usage/billing on OpenAI dashboard

## 📊 Monitoring

### Key Metrics to Watch
- **Response Times**: API routes should respond < 2s
- **Error Rates**: Check Vercel logs for 500 errors
- **Database Load**: Monitor Supabase dashboard
- **Webhook Success**: Check `webhook_logs` table

### Health Checks
- **API Health**: `GET /api/health` → Should return `200 OK`
- **Database**: `SELECT 1` → Should execute
- **Auth**: Login flow → Should redirect to dashboard

## 🔒 Security Best Practices

1. **Never expose**:
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Webhook secret keys
   - OpenAI API keys (use organization-specific keys)

2. **Always verify**:
   - RLS policies on every table
   - Authentication middleware on admin routes
   - Input validation on all API endpoints

3. **Regular audits**:
   - Review `user_sessions` table
   - Check `analytics_events` for suspicious activity
   - Monitor `webhook_logs` for failed deliveries

## 📞 Support

If issues persist:
1. Check console logs (F12 in browser)
2. Review Vercel deployment logs
3. Check Supabase logs
4. Verify all environment variables
5. Ensure database migration completed

---

**Deployment Date:** _________  
**Deployed By:** _________  
**Version:** v1.0.0  
**Production URL:** _________
