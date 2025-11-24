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
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'platform_admin' | 'restaurant_admin' | 'staff'
          phone: string | null
          last_login_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role: 'platform_admin' | 'restaurant_admin' | 'staff'
          phone?: string | null
          last_login_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'platform_admin' | 'restaurant_admin' | 'staff'
          phone?: string | null
          last_login_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      restaurants: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          primary_color: string | null
          address: string | null
          phone: string | null
          email: string | null
          wifi_ssid: string | null
          wifi_password: string | null
          webhook_url: string | null
          api_key: string | null
          description: string | null
          working_hours: Json | null
          status: 'active' | 'suspended' | 'pending'
          subscription_tier: 'starter' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          primary_color?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          wifi_ssid?: string | null
          wifi_password?: string | null
          webhook_url?: string | null
          api_key?: string | null
          description?: string | null
          working_hours?: Json | null
          status?: 'active' | 'suspended' | 'pending'
          subscription_tier?: 'starter' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          primary_color?: string | null
          address?: string | null
          phone?: string | null
          email?: string | null
          wifi_ssid?: string | null
          wifi_password?: string | null
          webhook_url?: string | null
          api_key?: string | null
          description?: string | null
          working_hours?: Json | null
          status?: 'active' | 'suspended' | 'pending'
          subscription_tier?: 'starter' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
        }
      }
      restaurant_admins: {
        Row: {
          id: string
          profile_id: string
          restaurant_id: string
          permissions: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          restaurant_id: string
          permissions?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          restaurant_id?: string
          permissions?: Json | null
          created_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          restaurant_id: string
          name_tr: string
          name_en: string | null
          description: string | null
          display_order: number | null
          visible: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          name_tr: string
          name_en?: string | null
          description?: string | null
          display_order?: number | null
          visible?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          name_tr?: string
          name_en?: string | null
          description?: string | null
          display_order?: number | null
          visible?: boolean | null
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          restaurant_id: string
          category_id: string | null
          name_tr: string
          name_en: string | null
          description_tr: string | null
          description_en: string | null
          price: number
          image_url: string | null
          allergens: string[] | null
          ai_tags: string[] | null
          is_available: boolean | null
          stock_count: number | null
          display_order: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          category_id?: string | null
          name_tr: string
          name_en?: string | null
          description_tr?: string | null
          description_en?: string | null
          price: number
          image_url?: string | null
          allergens?: string[] | null
          ai_tags?: string[] | null
          is_available?: boolean | null
          stock_count?: number | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          category_id?: string | null
          name_tr?: string
          name_en?: string | null
          description_tr?: string | null
          description_en?: string | null
          price?: number
          image_url?: string | null
          allergens?: string[] | null
          ai_tags?: string[] | null
          is_available?: boolean | null
          stock_count?: number | null
          display_order?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          restaurant_id: string
          qr_code_id: string | null
          order_number: string
          customer_name: string | null
          customer_phone: string | null
          customer_notes: string | null
          session_id: string | null
          status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'paid'
          subtotal: number
          tax_amount: number | null
          service_charge: number | null
          discount_amount: number | null
          total_amount: number
          payment_method: string | null
          payment_status: 'unpaid' | 'paid' | 'refunded'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          restaurant_id: string
          qr_code_id?: string | null
          order_number: string
          customer_name?: string | null
          customer_phone?: string | null
          customer_notes?: string | null
          session_id?: string | null
          status?: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'paid'
          subtotal: number
          tax_amount?: number | null
          service_charge?: number | null
          discount_amount?: number | null
          total_amount: number
          payment_method?: string | null
          payment_status?: 'unpaid' | 'paid' | 'refunded'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          restaurant_id?: string
          qr_code_id?: string | null
          order_number?: string
          customer_name?: string | null
          customer_phone?: string | null
          customer_notes?: string | null
          session_id?: string | null
          status?: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled' | 'paid'
          subtotal?: number
          tax_amount?: number | null
          service_charge?: number | null
          discount_amount?: number | null
          total_amount?: number
          payment_method?: string | null
          payment_status?: 'unpaid' | 'paid' | 'refunded'
          created_at?: string
          updated_at?: string
        }
      }
      ai_configs: {
        Row: {
          id: string
          restaurant_id: string
          personality: 'friendly' | 'professional' | 'fun' | 'formal' | 'casual' | null
          welcome_message_tr: string | null
          welcome_message_en: string | null
          custom_prompt: string | null
          language: string | null
          auto_translate: boolean | null
          voice_enabled: boolean | null
          model: string | null
          temperature: number | null
          max_tokens: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
            id?: string
            restaurant_id: string
            personality?: 'friendly' | 'professional' | 'fun' | 'formal' | 'casual' | null
            welcome_message_tr?: string | null
            welcome_message_en?: string | null
            custom_prompt?: string | null
            language?: string | null
            auto_translate?: boolean | null
            voice_enabled?: boolean | null
            model?: string | null
            temperature?: number | null
            max_tokens?: number | null
            created_at?: string
            updated_at?: string
        }
        Update: {
            id?: string
            restaurant_id?: string
            personality?: 'friendly' | 'professional' | 'fun' | 'formal' | 'casual' | null
            welcome_message_tr?: string | null
            welcome_message_en?: string | null
            custom_prompt?: string | null
            language?: string | null
            auto_translate?: boolean | null
            voice_enabled?: boolean | null
            model?: string | null
            temperature?: number | null
            max_tokens?: number | null
            created_at?: string
            updated_at?: string
        }
      }
      ai_conversations: {
          Row: {
              id: string
              restaurant_id: string
              session_id: string
              messages: Json
              metadata: Json | null
              created_at: string
              updated_at: string
          }
          Insert: {
              id?: string
              restaurant_id: string
              session_id: string
              messages: Json
              metadata?: Json | null
              created_at?: string
              updated_at?: string
          }
          Update: {
              id?: string
              restaurant_id?: string
              session_id?: string
              messages?: Json
              metadata?: Json | null
              created_at?: string
              updated_at?: string
          }
      }
      analytics_events: {
          Row: {
              id: string
              restaurant_id: string
              event_type: string
              event_data: Json | null
              session_id: string | null
              created_at: string
          }
          Insert: {
              id?: string
              restaurant_id: string
              event_type: string
              event_data?: Json | null
              session_id?: string | null
              created_at?: string
          }
          Update: {
              id?: string
              restaurant_id?: string
              event_type?: string
              event_data?: Json | null
              session_id?: string | null
              created_at?: string
          }
      }
      coupons: {
          Row: {
              id: string
              restaurant_id: string
              code: string
              description: string | null
              discount_type: 'percentage' | 'fixed' | null
              discount_value: number
              min_order_amount: number | null
              max_uses: number | null
              used_count: number
              valid_from: string
              valid_until: string | null
              is_active: boolean
              created_at: string
              updated_at: string
          }
          Insert: {
              id?: string
              restaurant_id: string
              code: string
              description?: string | null
              discount_type?: 'percentage' | 'fixed' | null
              discount_value: number
              min_order_amount?: number | null
              max_uses?: number | null
              used_count?: number
              valid_from: string
              valid_until?: string | null
              is_active?: boolean
              created_at?: string
              updated_at?: string
          }
          Update: {
              id?: string
              restaurant_id?: string
              code?: string
              description?: string | null
              discount_type?: 'percentage' | 'fixed' | null
              discount_value?: number
              min_order_amount?: number | null
              max_uses?: number | null
              used_count?: number
              valid_from?: string
              valid_until?: string | null
              is_active?: boolean
              created_at?: string
              updated_at?: string
          }
      }
      campaigns: {
          Row: {
              id: string
              restaurant_id: string
              title: string
              description: string | null
              discount_percentage: number | null
              discount_amount: number | null
              active: boolean | null
              start_date: string | null
              end_date: string | null
              conditions: Json | null
              created_at: string
              updated_at: string
          }
          Insert: {
              id?: string
              restaurant_id: string
              title: string
              description?: string | null
              discount_percentage?: number | null
              discount_amount?: number | null
              active?: boolean | null
              start_date?: string | null
              end_date?: string | null
              conditions?: Json | null
              created_at?: string
              updated_at?: string
          }
          Update: {
              id?: string
              restaurant_id?: string
              title?: string
              description?: string | null
              discount_percentage?: number | null
              discount_amount?: number | null
              active?: boolean | null
              start_date?: string | null
              end_date?: string | null
              conditions?: Json | null
              created_at?: string
              updated_at?: string
          }
      }
      loyalty_points: {
          Row: {
              id: string
              restaurant_id: string
              customer_phone: string
              customer_name: string | null
              total_points: number
              lifetime_points: number
              last_transaction_at: string | null
              created_at: string
              updated_at: string
          }
          Insert: {
              id?: string
              restaurant_id: string
              customer_phone: string
              customer_name?: string | null
              total_points?: number
              lifetime_points?: number
              last_transaction_at?: string | null
              created_at?: string
              updated_at?: string
          }
          Update: {
              id?: string
              restaurant_id?: string
              customer_phone?: string
              customer_name?: string | null
              total_points?: number
              lifetime_points?: number
              last_transaction_at?: string | null
              created_at?: string
              updated_at?: string
          }
      }
      loyalty_transactions: {
          Row: {
              id: string
              loyalty_points_id: string
              order_id: string | null
              transaction_type: string
              points: number
              description: string | null
              created_at: string
          }
          Insert: {
              id?: string
              loyalty_points_id: string
              order_id?: string | null
              transaction_type: string
              points: number
              description?: string | null
              created_at?: string
          }
          Update: {
              id?: string
              loyalty_points_id?: string
              order_id?: string | null
              transaction_type?: string
              points?: number
              description?: string | null
              created_at?: string
          }
      }
      table_calls: {
          Row: {
              id: string
              restaurant_id: string
              table_number: string
              call_type: string
              status: string
              customer_note: string | null
              resolved_by: string | null
              resolved_at: string | null
              created_at: string
              updated_at: string
          }
          Insert: {
              id?: string
              restaurant_id: string
              table_number: string
              call_type?: string
              status?: string
              customer_note?: string | null
              resolved_by?: string | null
              resolved_at?: string | null
              created_at?: string
              updated_at?: string
          }
          Update: {
              id?: string
              restaurant_id?: string
              table_number?: string
              call_type?: string
              status?: string
              customer_note?: string | null
              resolved_by?: string | null
              resolved_at?: string | null
              created_at?: string
              updated_at?: string
          }
      }
      qr_codes: {
          Row: {
              id: string
              restaurant_id: string
              table_number: string
              qr_code_hash: string
              location_description: string | null
              status: string
              scan_count: number
              last_scanned_at: string | null
              created_at: string
              updated_at: string
          }
          Insert: {
              id?: string
              restaurant_id: string
              table_number: string
              qr_code_hash: string
              location_description?: string | null
              status?: string
              scan_count?: number
              last_scanned_at?: string | null
              created_at?: string
              updated_at?: string
          }
          Update: {
              id?: string
              restaurant_id?: string
              table_number?: string
              qr_code_hash?: string
              location_description?: string | null
              status?: string
              scan_count?: number
              last_scanned_at?: string | null
              created_at?: string
              updated_at?: string
          }
      }
      reviews: {
          Row: {
              id: string
              restaurant_id: string
              order_id: string | null
              customer_name: string | null
              rating: number
              comment: string | null
              response: string | null
              responded_by: string | null
              responded_at: string | null
              is_published: boolean
              created_at: string
              updated_at: string
              is_reported: boolean | null
              report_reason: string | null
              admin_resolution: string | null
          }
          Insert: {
              id?: string
              restaurant_id: string
              order_id?: string | null
              customer_name?: string | null
              rating: number
              comment?: string | null
              response?: string | null
              responded_by?: string | null
              responded_at?: string | null
              is_published?: boolean
              created_at?: string
              updated_at?: string
              is_reported?: boolean | null
              report_reason?: string | null
              admin_resolution?: string | null
          }
          Update: {
              id?: string
              restaurant_id?: string
              order_id?: string | null
              customer_name?: string | null
              rating?: number
              comment?: string | null
              response?: string | null
              responded_by?: string | null
              responded_at?: string | null
              is_published?: boolean
              created_at?: string
              updated_at?: string
              is_reported?: boolean | null
              report_reason?: string | null
              admin_resolution?: string | null
          }
      }
      webhook_configs: {
          Row: {
              id: string
              restaurant_id: string
              name: string
              url: string
              secret_key: string
              events: string[]
              is_active: boolean
              retry_enabled: boolean
              max_retries: number
              timeout_seconds: number
              custom_headers: Json | null
              last_triggered_at: string | null
              created_at: string
              updated_at: string
          }
          Insert: {
              id?: string
              restaurant_id: string
              name: string
              url: string
              secret_key?: string
              events?: string[]
              is_active?: boolean
              retry_enabled?: boolean
              max_retries?: number
              timeout_seconds?: number
              custom_headers?: Json | null
              last_triggered_at?: string | null
              created_at?: string
              updated_at?: string
          }
          Update: {
              id?: string
              restaurant_id?: string
              name?: string
              url?: string
              secret_key?: string
              events?: string[]
              is_active?: boolean
              retry_enabled?: boolean
              max_retries?: number
              timeout_seconds?: number
              custom_headers?: Json | null
              last_triggered_at?: string | null
              created_at?: string
              updated_at?: string
          }
      }
    }
    Views: {
      [_: string]: never
    }
    Functions: {
      [_: string]: never
    }
    Enums: {
      [_: string]: never
    }
    CompositeTypes: {
      [_: string]: never
    }
  }
}
