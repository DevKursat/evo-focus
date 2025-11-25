export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            restaurants: {
                Row: {
                    id: string
                    created_at: string
                    name: string
                    slug: string
                    description: string | null
                    address: string | null
                    phone: string | null
                    email: string | null
                    logo_url: string | null
                    banner_url: string | null
                    primary_color: string | null
                    secondary_color: string | null
                    wifi_ssid: string | null
                    wifi_password: string | null
                    status: string
                    subscription_tier: string
                    working_hours: Json | null
                    social_media: Json | null
                    features: Json | null
                    settings: Json | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    name: string
                    slug: string
                    description?: string | null
                    address?: string | null
                    phone?: string | null
                    email?: string | null
                    logo_url?: string | null
                    banner_url?: string | null
                    primary_color?: string | null
                    secondary_color?: string | null
                    wifi_ssid?: string | null
                    wifi_password?: string | null
                    status?: string
                    subscription_tier?: string
                    working_hours?: Json | null
                    social_media?: Json | null
                    features?: Json | null
                    settings?: Json | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    name?: string
                    slug?: string
                    description?: string | null
                    address?: string | null
                    phone?: string | null
                    email?: string | null
                    logo_url?: string | null
                    banner_url?: string | null
                    primary_color?: string | null
                    secondary_color?: string | null
                    wifi_ssid?: string | null
                    wifi_password?: string | null
                    status?: string
                    subscription_tier?: string
                    working_hours?: Json | null
                    social_media?: Json | null
                    features?: Json | null
                    settings?: Json | null
                }
            }
            categories: {
                Row: {
                    id: string
                    created_at: string
                    restaurant_id: string
                    name: string
                    description: string | null
                    image_url: string | null
                    display_order: number
                    is_active: boolean
                    name_tr?: string
                    name_en?: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    restaurant_id: string
                    name: string
                    description?: string | null
                    image_url?: string | null
                    display_order?: number
                    is_active?: boolean
                    name_tr?: string
                    name_en?: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    restaurant_id?: string
                    name?: string
                    description?: string | null
                    image_url?: string | null
                    display_order?: number
                    is_active?: boolean
                    name_tr?: string
                    name_en?: string
                }
            }
            products: {
                Row: {
                    id: string
                    created_at: string
                    category_id: string
                    restaurant_id: string
                    name: string
                    description: string | null
                    price: number
                    image_url: string | null
                    is_available: boolean
                    display_order: number
                    preparation_time: number | null
                    calories: number | null
                    allergens: string[] | null
                    ingredients: string[] | null
                    name_tr?: string
                    name_en?: string
                    description_tr?: string
                    description_en?: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    category_id: string
                    restaurant_id: string
                    name: string
                    description?: string | null
                    price: number
                    image_url?: string | null
                    is_available?: boolean
                    display_order?: number
                    preparation_time?: number | null
                    calories?: number | null
                    allergens?: string[] | null
                    ingredients?: string[] | null
                    name_tr?: string
                    name_en?: string
                    description_tr?: string
                    description_en?: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    category_id?: string
                    restaurant_id?: string
                    name?: string
                    description?: string | null
                    price?: number
                    image_url?: string | null
                    is_available?: boolean
                    display_order?: number
                    preparation_time?: number | null
                    calories?: number | null
                    allergens?: string[] | null
                    ingredients?: string[] | null
                    name_tr?: string
                    name_en?: string
                    description_tr?: string
                    description_en?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    created_at: string
                    restaurant_id: string
                    table_id: string | null
                    status: string
                    total_amount: number
                    customer_name: string | null
                    customer_note: string | null
                    payment_status: string
                    payment_method: string | null
                    qr_code_id: string | null
                    order_number: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    restaurant_id: string
                    table_id?: string | null
                    status?: string
                    total_amount: number
                    customer_name?: string | null
                    customer_note?: string | null
                    payment_status?: string
                    payment_method?: string | null
                    qr_code_id?: string | null
                    order_number?: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    restaurant_id?: string
                    table_id?: string | null
                    status?: string
                    total_amount?: number
                    customer_name?: string | null
                    customer_note?: string | null
                    payment_status?: string
                    payment_method?: string | null
                    qr_code_id?: string | null
                    order_number?: string
                }
            }
            order_items: {
                Row: {
                    id: string
                    created_at: string
                    order_id: string
                    product_id: string
                    quantity: number
                    price: number
                    notes: string | null
                    options: Json | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    order_id: string
                    product_id: string
                    quantity: number
                    price: number
                    notes?: string | null
                    options?: Json | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    order_id?: string
                    product_id?: string
                    quantity?: number
                    price?: number
                    notes?: string | null
                    options?: Json | null
                }
            }
            waiter_calls: {
                Row: {
                    id: string
                    created_at: string
                    restaurant_id: string
                    table_id: string | null
                    qr_code_id: string | null
                    type: string
                    status: string
                    resolved_at: string | null
                    customer_name: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    restaurant_id: string
                    table_id?: string | null
                    qr_code_id?: string | null
                    type?: string
                    status?: string
                    resolved_at?: string | null
                    customer_name?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    restaurant_id?: string
                    table_id?: string | null
                    qr_code_id?: string | null
                    type?: string
                    status?: string
                    resolved_at?: string | null
                    customer_name?: string | null
                }
            }
            reviews: {
                Row: {
                    id: string
                    created_at: string
                    restaurant_id: string
                    order_id: string | null
                    rating: number
                    comment: string | null
                    customer_name: string | null
                    is_published: boolean
                    reply: string | null
                    replied_at: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    restaurant_id: string
                    order_id?: string | null
                    rating: number
                    comment?: string | null
                    customer_name?: string | null
                    is_published?: boolean
                    reply?: string | null
                    replied_at?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    restaurant_id?: string
                    order_id?: string | null
                    rating?: number
                    comment?: string | null
                    customer_name?: string | null
                    is_published?: boolean
                    reply?: string | null
                    replied_at?: string | null
                }
            }
            profiles: {
                Row: {
                    id: string
                    created_at: string
                    email: string
                    full_name: string | null
                    avatar_url: string | null
                    role: string
                }
                Insert: {
                    id: string
                    created_at?: string
                    email: string
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    email?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    role?: string
                }
            }
            restaurant_admins: {
                Row: {
                    id: string
                    created_at: string
                    restaurant_id: string
                    profile_id: string
                    role: string
                }
                Insert: {
                    id?: string
                    created_at?: string
                    restaurant_id: string
                    profile_id: string
                    role?: string
                }
                Update: {
                    id?: string
                    created_at?: string
                    restaurant_id?: string
                    profile_id?: string
                    role?: string
                }
            }
            ai_configs: {
                Row: {
                    id: string
                    created_at: string
                    restaurant_id: string
                    personality: string
                    welcome_message: string | null
                    welcome_message_tr: string | null
                    welcome_message_en: string | null
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    created_at?: string
                    restaurant_id: string
                    personality?: string
                    welcome_message?: string | null
                    welcome_message_tr?: string | null
                    welcome_message_en?: string | null
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    restaurant_id?: string
                    personality?: string
                    welcome_message?: string | null
                    welcome_message_tr?: string | null
                    welcome_message_en?: string | null
                    is_active?: boolean
                }
            }
            coupons: {
                Row: {
                    id: string
                    created_at: string
                    restaurant_id: string
                    code: string
                    discount_type: string
                    discount_value: number
                    min_purchase: number | null
                    max_discount: number | null
                    valid_from: string | null
                    valid_until: string | null
                    max_usage: number | null
                    used_count: number
                    is_active: boolean
                }
                Insert: {
                    id?: string
                    created_at?: string
                    restaurant_id: string
                    code: string
                    discount_type: string
                    discount_value: number
                    min_purchase?: number | null
                    max_discount?: number | null
                    valid_from?: string | null
                    valid_until?: string | null
                    max_usage?: number | null
                    used_count?: number
                    is_active?: boolean
                }
                Update: {
                    id?: string
                    created_at?: string
                    restaurant_id?: string
                    code?: string
                    discount_type?: string
                    discount_value?: number
                    min_purchase?: number | null
                    max_discount?: number | null
                    valid_from?: string | null
                    valid_until?: string | null
                    max_usage?: number | null
                    used_count?: number
                    is_active?: boolean
                }
            }
            admin_activity_logs: {
                Row: {
                    id: string
                    created_at: string
                    restaurant_id: string
                    profile_id: string
                    action: string
                    details: Json | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    restaurant_id: string
                    profile_id: string
                    action: string
                    details?: Json | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    restaurant_id?: string
                    profile_id?: string
                    action?: string
                    details?: Json | null
                }
            }
            review_complaints: {
                Row: {
                    id: string
                    created_at: string
                    review_id: string
                    restaurant_id: string
                    reason: string
                    status: string
                    resolution_note: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    review_id: string
                    restaurant_id: string
                    reason: string
                    status?: string
                    resolution_note?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    review_id?: string
                    restaurant_id?: string
                    reason?: string
                    status?: string
                    resolution_note?: string | null
                }
            }
            qr_codes: {
                Row: {
                    id: string
                    created_at: string
                    restaurant_id: string
                    table_number: string
                    area: string | null
                    qr_code_url: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    restaurant_id: string
                    table_number: string
                    area?: string | null
                    qr_code_url?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    restaurant_id?: string
                    table_number?: string
                    area?: string | null
                    qr_code_url?: string | null
                }
            }
            loyalty_points: {
                Row: {
                    id: string
                    created_at: string
                    restaurant_id: string
                    customer_name: string | null
                    customer_phone: string | null
                    total_points: number
                    lifetime_points: number
                    last_transaction_at: string | null
                }
                Insert: {
                    id?: string
                    created_at?: string
                    restaurant_id: string
                    customer_name?: string | null
                    customer_phone?: string | null
                    total_points: number
                    lifetime_points: number
                    last_transaction_at?: string | null
                }
                Update: {
                    id?: string
                    created_at?: string
                    restaurant_id?: string
                    customer_name?: string | null
                    customer_phone?: string | null
                    total_points?: number
                    lifetime_points?: number
                    last_transaction_at?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
