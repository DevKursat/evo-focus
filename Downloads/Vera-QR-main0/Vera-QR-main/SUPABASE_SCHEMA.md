# VERA QR - Supabase Schema Reference

This document serves as the strict source of truth for the Supabase database schema used in the Vera QR project.

## 1. Database Schema

The database is designed with **multi-tenancy** in mind, where `restaurants` are the tenants.

### Core Tables

#### `profiles`
User profiles linked to `auth.users`.
- `id` (UUID, PK): References `auth.users.id`
- `email` (VARCHAR): Unique email
- `role` (VARCHAR): 'platform_admin', 'restaurant_admin', 'staff'
- `full_name`, `avatar_url`, `phone`, `is_active`

#### `restaurants`
The main tenant table.
- `id` (UUID, PK)
- `name`, `slug` (Unique), `description`
- `logo_url` (Storage: 'restaurant-logos')
- `primary_color` (Default: '#3B82F6')
- `working_hours` (JSONB)
- `status` ('active', 'suspended', 'pending')
- `subscription_tier` ('starter', 'pro', 'enterprise')
- `wifi_ssid`, `wifi_password` (VARCHAR): For QR Wi-Fi connection
- `webhook_url` (TEXT): For external integrations
- `api_key` (VARCHAR): For API access
- `address`, `phone`, `email`

#### `restaurant_admins`
Join table linking profiles to restaurants.
- `profile_id` (UUID, FK -> profiles)
- `restaurant_id` (UUID, FK -> restaurants)
- `permissions` (JSONB)

### Menu & Products

#### `categories`
Menu categories (e.g., "Starters", "Drinks").
- `id` (UUID, PK)
- `restaurant_id` (UUID, FK)
- `name_tr`, `name_en` (VARCHAR)
- `display_order` (INT), `visible` (BOOL)

#### `products`
Menu items.
- `id` (UUID, PK)
- `restaurant_id` (UUID, FK)
- `category_id` (UUID, FK)
- `name_tr`, `name_en` (VARCHAR)
- `description_tr`, `description_en` (TEXT)
- `price` (DECIMAL)
- `image_url` (Storage: 'product-images')
- `allergens` (TEXT[]), `ai_tags` (TEXT[])
- `is_available` (BOOL), `stock_count` (INT)
- `ai_description_tr`, `ai_description_en` (TEXT): AI-generated descriptions

### Operations

#### `qr_codes`
QR codes assigned to tables.
- `id` (UUID, PK)
- `restaurant_id` (UUID, FK)
- `table_number` (VARCHAR)
- `qr_code_hash` (VARCHAR, Unique)
- `location_description` (TEXT)
- `status` ('active', 'inactive', 'damaged')

#### `orders`
Customer orders.
- `id` (UUID, PK)
- `restaurant_id` (UUID, FK)
- `qr_code_id` (UUID, FK -> qr_codes)
- `order_number` (VARCHAR, Unique)
- `status` ('pending', 'preparing', 'ready', 'served', 'cancelled', 'paid')
- `total_amount`, `subtotal`, `tax_amount`
- `payment_status` ('unpaid', 'paid', 'refunded')

#### `order_items`
Items within an order.
- `id` (UUID, PK)
- `order_id` (UUID, FK)
- `product_id` (UUID, FK)
- `product_name`, `product_price` (Snapshot values)
- `quantity` (INT), `notes` (TEXT)

### AI & Settings

#### `ai_configs`
Configuration for the AI assistant per restaurant.
- `restaurant_id` (UUID, FK, Unique)
- `personality` ('friendly', 'professional', etc.)
- `custom_prompt` (TEXT)
- `welcome_message_tr`, `welcome_message_en`

#### `ai_conversations`
History of AI chats.
- `restaurant_id` (UUID, FK)
- `session_id` (VARCHAR)
- `messages` (JSONB)

### Marketing & Loyalty

#### `campaigns`
- `restaurant_id` (UUID, FK)
- `title`, `description`, `discount_percentage`
- `start_date`, `end_date`, `active`

#### `coupons`
- `id` (UUID, PK)
- `restaurant_id` (UUID, FK)
- `code` (VARCHAR)
- `discount_amount`, `discount_type`
- `max_uses`, `used_count`
- `expires_at`

#### `loyalty_points`
- `restaurant_id` (UUID, FK)
- `customer_phone` (VARCHAR)
- `total_points`, `lifetime_points`

#### `loyalty_rewards`
- `restaurant_id` (UUID, FK)
- `points_required` (INT)
- `reward_type`, `reward_value` (JSONB)

#### `notifications`
- `id` (UUID, PK)
- `restaurant_id` (UUID, FK)
- `title`, `message`
- `is_read` (BOOL)
- `created_at`

### Platform

#### `platform_settings`
Global settings for the platform admin.
- `key` (VARCHAR, PK)
- `value` (JSONB)

## 2. Storage Buckets

- **restaurant-logos**: Public, Max 2MB, Images.
- **product-images**: Public, Max 5MB, Images.
- **qr-codes**: Public, Max 1MB, Images/PDF.

## 3. Row Level Security (RLS)

- **Public Read**: `restaurants`, `categories`, `products`, `qr_codes`, `reviews`, `loyalty_rewards`.
- **Authenticated Write**: `restaurant_admin` users can manage resources for their specific `restaurant_id`.
- **Platform Admin**: Full access to all tables via service role or specific policies.
- **Coupons/Notifications**: Protected by RLS, accessible to restaurant admins.

## 4. Key Directives for Developers

1. **Strict Naming**: Always use `name_tr` / `name_en` for localized fields. Do not use generic `name`.
2. **Tenant Isolation**: Every query for restaurant data MUST filter by `restaurant_id`.
3. **Role Checks**: Use `profiles.role` to determine user permissions (`platform_admin` vs `restaurant_admin`).
