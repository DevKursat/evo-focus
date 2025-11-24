import { z } from 'zod'

export const organizationSchema = z.object({
  name: z.string().min(2, 'İsim en az 2 karakter olmalıdır').max(255),
  slug: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/, 'Slug sadece küçük harf, rakam ve tire içerebilir'),
  description: z.string().optional(),
  address: z.string().optional(),
  brand_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Geçerli bir hex renk kodu giriniz').optional(),
  working_hours: z.record(z.object({
    open: z.string(),
    close: z.string(),
    closed: z.boolean().optional(),
  })).optional(),
})

export const menuCategorySchema = z.object({
  name: z.string().min(1, 'Kategori adı gereklidir').max(255),
  display_order: z.number().int().min(0).optional(),
  visible: z.boolean().optional(),
})

export const menuItemSchema = z.object({
  category_id: z.string().uuid('Geçerli bir kategori seçiniz').optional(),
  name: z.string().min(1, 'Ürün adı gereklidir').max(255),
  description: z.string().optional(),
  price: z.number().positive('Fiyat sıfırdan büyük olmalıdır'),
  allergens: z.array(z.string()).optional(),
  available: z.boolean().optional(),
  stock_count: z.number().int().min(0).optional(),
})

export const tableSchema = z.object({
  table_number: z.string().min(1, 'Masa numarası gereklidir').max(50),
  location_description: z.string().optional(),
  status: z.enum(['available', 'occupied', 'reserved', 'disabled']).optional(),
})

export const orderSchema = z.object({
  table_id: z.string().uuid().optional(),
  items: z.array(z.object({
    id: z.string().uuid(),
    name: z.string(),
    price: z.number(),
    quantity: z.number().int().positive(),
    notes: z.string().optional(),
  })).min(1, 'En az bir ürün seçmelisiniz'),
  customer_name: z.string().optional(),
  customer_notes: z.string().optional(),
})

export const campaignSchema = z.object({
  title: z.string().min(1, 'Kampanya başlığı gereklidir').max(255),
  description: z.string().optional(),
  discount_percentage: z.number().int().min(0).max(100).optional(),
  discount_amount: z.number().positive().optional(),
  active: z.boolean().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
})

export const adminUserSchema = z.object({
  email: z.string().email('Geçerli bir email adresi giriniz'),
  password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır'),
  full_name: z.string().min(2, 'İsim en az 2 karakter olmalıdır').optional(),
  role: z.enum(['platform_admin', 'restaurant_admin', 'staff']).optional(),
})

export const aiChatMessageSchema = z.object({
  message: z.string().min(1, 'Mesaj boş olamaz').max(1000),
  session_id: z.string(),
  organization_id: z.string().uuid(),
})

// Validation helper functions
export function validateOrganization(data: unknown) {
  return organizationSchema.parse(data)
}

export function validateMenuCategory(data: unknown) {
  return menuCategorySchema.parse(data)
}

export function validateMenuItem(data: unknown) {
  return menuItemSchema.parse(data)
}

export function validateTable(data: unknown) {
  return tableSchema.parse(data)
}

export function validateOrder(data: unknown) {
  return orderSchema.parse(data)
}

export function validateCampaign(data: unknown) {
  return campaignSchema.parse(data)
}

export function validateAdminUser(data: unknown) {
  return adminUserSchema.parse(data)
}

export function validateAIChatMessage(data: unknown) {
  return aiChatMessageSchema.parse(data)
}
