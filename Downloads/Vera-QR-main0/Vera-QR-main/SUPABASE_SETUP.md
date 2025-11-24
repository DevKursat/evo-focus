# VERA QR - Supabase Configuration Guide

## Environment Setup

The project is configured to use the following Supabase project:

- **Project URL**: `https://cpjgzvdoxmuywizlecqo.supabase.co`
- **Project Reference**: `cpjgzvdoxmuywizlecqo`

### Required Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://cpjgzvdoxmuywizlecqo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwamd6dmRveG11eXdpemxlY3FvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1ODU4NDAsImV4cCI6MjA3OTE2MTg0MH0.RFGYao76zvEjTpdWzCBxlNhPTppshIrodcd3vCe8xQE
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwamd6dmRveG11eXdpemxlY3FvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU4NTg0MCwiZXhwIjoyMDc5MTYxODQwfQ.qi-E_HZHZ-5VwylYKBZNDErd_f2Jj8ZrL5Auez1iOzs

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
PLATFORM_ADMIN_EMAIL=admin@veraqr.com

# Optional: OpenAI API (for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Optional: Google Maps (for address autocomplete)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## Database Setup

### 1. Run the Database Schema

Execute the SQL scripts in the following order:

1. **Cleanup** (if needed):
   ```bash
   supabase db reset
   # or manually run: supabase/cleanup.sql
   ```

2. **Create Schema**:
   ```bash
   # Run the main schema file
   # File: supabase/schema.sql
   ```
   
   This will create:
   - All tables (profiles, restaurants, categories, products, etc.)
   - Storage buckets for images and QR codes
   - Row Level Security (RLS) policies
   - Indexes for performance
   - Triggers for automatic updates
   - Webhook support tables

3. **Seed Data** (Optional):
   ```bash
   # File: supabase/seed.sql
   ```

### 2. Create Initial Admin User

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" or "Invite User"
3. Create user with:
   - Email: `admin@veraqr.com`
   - Password: `admin1` (or your preferred password)
4. Copy the generated UUID

5. Run SQL to create admin profile:
   ```sql
   INSERT INTO profiles (id, email, full_name, role, is_active)
   VALUES (
     'YOUR-USER-UUID-HERE',
     'admin@veraqr.com',
     'Platform Admin',
     'platform_admin',
     true
   );
   ```

## Vercel Deployment

### Environment Variables for Production

In your Vercel project settings, add the following environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://cpjgzvdoxmuywizlecqo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon key from above]
SUPABASE_SERVICE_ROLE_KEY=[service role key from above]
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
PLATFORM_ADMIN_EMAIL=admin@veraqr.com
OPENAI_API_KEY=[your OpenAI key if using AI features]
```

### Deploy Command

```bash
vercel --prod
```

## Key Features Configured

### 1. Authentication
- Email/Password authentication via Supabase Auth
- Role-based access control (platform_admin, restaurant_admin, staff)
- Row Level Security enforced on all tables

### 2. Multi-tenancy
- Each restaurant is isolated via RLS policies
- Restaurant admins can only access their own data
- Platform admins have full access

### 3. Webhook Integration
- Webhook URL can be configured per restaurant
- Events: order.created, order.updated, review.created, etc.
- Test webhook functionality in Settings → Integrations

### 4. Multi-language Support
- Turkish (TR) and English (EN)
- All menu items support both languages (name_tr, name_en, description_tr, description_en)
- UI language toggle in navbar

### 5. Dark Mode
- Full dark mode support across all pages
- Theme preference persisted in localStorage
- Tailwind CSS dark: classes used throughout

## Testing

### Login Flow
1. Navigate to `/auth/login`
2. Login with:
   - Email: `admin@veraqr.com`
   - Password: `admin1`
3. Should redirect to:
   - Platform Admin → `/admin`
   - Restaurant Admin → `/dashboard`

### Webhook Testing
1. Go to `/dashboard/settings`
2. Click "Integrations" tab
3. Enter a webhook URL (e.g., https://webhook.site/unique-url)
4. Click "Test Webhook" to send a test payload

## Troubleshooting

### Database Connection Issues
- Verify the Supabase URL and keys are correct
- Check if the Supabase project is active
- Ensure you're using the correct region

### Authentication Issues
- Verify the user exists in Supabase Auth
- Check if the profile exists in the profiles table
- Verify RLS policies are enabled

### Build Issues
- Run `npm install` to ensure dependencies are installed
- Run `npm run build` to check for TypeScript errors
- Check `.env.local` file exists and is properly formatted

## Support

For issues or questions:
- Email: support@veraqr.com
- GitHub: Create an issue in the repository
