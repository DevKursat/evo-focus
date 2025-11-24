import OpenAI from 'openai'
import type { Database } from '@/lib/supabase/types'

type Restaurant = Database['public']['Tables']['restaurants']['Row']
type Product = Database['public']['Tables']['products']['Row']

// Flattened product type for AI context
export interface MenuItem extends Product {
    name: string // derived from name_tr or name_en
    description: string | null // derived
    available: boolean
    allergens: string[]
}

// Use Restaurant type directly
export type Organization = Restaurant

// Helper to get OpenAI client with custom or default API key
export function getOpenAIClient(customApiKey?: string): OpenAI | null {
  const apiKey = customApiKey || process.env.OPENAI_API_KEY
  if (!apiKey) {
    return null
  }
  try {
    return new OpenAI({
      apiKey,
    })
  } catch {
    return null
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface MenuContext {
  organization: Organization
  menuItems: MenuItem[]
  categories: { id: string; name: string }[]
  aiPersonality?: string
}

const PERSONALITY_PROMPTS = {
  friendly: {
    tone: 'sıcak, dostane ve samimi',
    style: 'Emojiler kullan 😊, müşteriye ismiyle hitap et, şakacı ve neşeli ol',
    greeting: 'Merhaba! Hoş geldin! 🎉 Ben senin için buradayım, ne istersin?'
  },
  professional: {
    tone: 'profesyonel, kibar ve saygılı',
    style: 'Resmi bir dil kullan, net ve açık bilgi ver, efendi/hanımefendi gibi hitaplar kullan',
    greeting: 'Hoş geldiniz. Size nasıl yardımcı olabilirim?'
  },
  fun: {
    tone: 'eğlenceli, yaratıcı ve enerjik',
    style: 'Bol emoji kullan 🍕🎊, kelime oyunları yap, yemekleri heyecanlı şekilde tanımla',
    greeting: 'Heyyyy! 🌟 Harika bir gün için harika yemekler hazırız! Ne denemek istersin? 🤩'
  },
  formal: {
    tone: 'resmi, ciddi ve kurumsal',
    style: 'Tamamen profesyonel dil kullan, emoji yok, detaylı ve teknik bilgi ver',
    greeting: 'Hoş geldiniz. Menümüzden seçim yapmanıza yardımcı olmaktan memnuniyet duyarız.'
  },
  casual: {
    tone: 'rahat, arkadaşça ve içten',
    style: 'Günlük konuşma dili kullan, "ya", "moruk" gibi kelimeler kullanabilirsin, rahat ol',
    greeting: 'Selam! Ne var ne yok? 👋 Bugün ne yiyelim bakalım?'
  }
}

export function generateSystemPrompt(context: MenuContext): string {
  const { organization, menuItems, categories, aiPersonality = 'friendly' } = context
  const personality = PERSONALITY_PROMPTS[aiPersonality as keyof typeof PERSONALITY_PROMPTS] || PERSONALITY_PROMPTS.friendly

  const categorizedMenu = categories.map(category => {
    const items = menuItems
      .filter(item => item.category_id === category.id && item.available)
      .map(item => {
        const allergenInfo = item.allergens.length > 0
          ? ` (Alerjenler: ${item.allergens.join(', ')})`
          : ''
        // Include ID for recommendation matching
        return `- [ID: ${item.id}] ${item.name}: ${item.price} TL - ${item.description || 'Açıklama yok'}${allergenInfo}`
      })
      .join('\n')

    return `\n**${category.name}**\n${items}`
  }).join('\n')

  return `Sen ${organization.name} restoranının yardımcı AI asistanısın. Müşterilere menü hakkında bilgi vererek, sipariş vermelerine yardımcı oluyorsun.

**Kişilik Özelliğin:**
- Ton: ${personality.tone}
- Stil: ${personality.style}
- İlk Selamlaşma: "${personality.greeting}"

**Restoran Bilgileri:**
- İsim: ${organization.name}
- Açıklama: ${organization.description || 'Lezzetli yemekler sunuyoruz'}
- Adres: ${organization.address || 'Adres bilgisi mevcut değil'}

**Menü:**
${categorizedMenu}

**Görevlerin:**
1. Müşterilere menüdeki ürünler hakkında detaylı bilgi ver
2. Müşteri tercihlerine göre öneri yap
3. Alerjen bilgilerini önemle belirt
4. Sipariş vermeye yardımcı ol
5. SEÇİLEN KİŞİLİK ÖZELLİĞİNE UYGUN konuş (${aiPersonality})
6. Türkçe konuş

**ÖNERİ FORMATI (ÇOK ÖNEMLİ):**
Eğer müşteriye spesifik bir ürünü öneriyorsan veya o ürün hakkında detay veriyorsan, cümlenin sonuna veya ürünün geçtiği yere şu formatı ekle:
[RECOMMEND: ÜRÜN_ID]
Örnek: "Size harika bir Margherita Pizza öneririm! [RECOMMEND: 123e4567-e89b-12d3-a456-426614174000]"

**Önemli Notlar:**
- Sadece menüde olan ürünler hakkında bilgi ver
- Fiyatları doğru söyle
- Alerjen bilgilerini her zaman belirt
- Müşteri memnuniyetini ön planda tut
- Eğer bir şey bilmiyorsan, dürüstçe söyle ve garson çağırmalarını öner
- Kişilik özelliğine sadık kal, ${personality.tone} bir şekilde konuş

Şimdi müşteriyle konuşmaya başla!`
}

export async function sendChatMessage(
  messages: ChatMessage[],
  context: MenuContext,
  customApiKey?: string
): Promise<string> {
  try {
    const openai = getOpenAIClient(customApiKey)
    if (!openai) {
      return 'OpenAI servisi şu anda kullanılamıyor.'
    }
    
    const systemPrompt = generateSystemPrompt(context)
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    return response.choices[0]?.message?.content || 'Üzgünüm, bir hata oluştu.'
  } catch (error) {
    console.error('OpenAI API error:', error)
    throw new Error('AI asistan şu anda kullanılamıyor')
  }
}

export async function generateMenuRecommendations(
  userPreferences: string,
  context: MenuContext,
  customApiKey?: string
): Promise<string[]> {
  try {
    const openai = getOpenAIClient(customApiKey)
    if (!openai) {
      return []
    }
    
    const systemPrompt = `Sen bir restoran menü uzmanısın. Aşağıdaki menüden müşteri tercihlerine göre 3-5 öneri yap.

Menü:
${context.menuItems
  .filter(item => item.available)
  .map(item => `${item.name}: ${item.description}`)
  .join('\n')}

Müşteri tercihi: ${userPreferences}

Sadece ürün isimlerini virgülle ayırarak listele.`

    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [{ role: 'system', content: systemPrompt }],
      temperature: 0.8,
      max_tokens: 150,
    })

    const content = response.choices[0]?.message?.content || ''
    return content.split(',').map(item => item.trim()).filter(Boolean)
  } catch (error) {
    console.error('OpenAI API error:', error)
    return []
  }
}

export async function analyzeCustomerQuery(
  query: string,
  customApiKey?: string
): Promise<{
  intent: 'order' | 'question' | 'recommendation' | 'complaint' | 'other'
  entities: string[]
}> {
  try {
    const openai = getOpenAIClient(customApiKey)
    if (!openai) {
      return { intent: 'other', entities: [] }
    }
    
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: `Müşteri sorgusunu analiz et ve JSON formatında cevapla:
{
  "intent": "order|question|recommendation|complaint|other",
  "entities": ["ürün adları veya anahtar kelimeler"]
}`,
        },
        { role: 'user', content: query },
      ],
      temperature: 0.3,
      max_tokens: 100,
      response_format: { type: 'json_object' },
    })

    const content = response.choices[0]?.message?.content || '{}'
    return JSON.parse(content)
  } catch (error) {
    console.error('OpenAI API error:', error)
    return { intent: 'other', entities: [] }
  }
}
