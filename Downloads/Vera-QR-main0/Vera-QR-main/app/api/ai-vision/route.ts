import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

// Initialize OpenAI only when API key is available
let openai: OpenAI | null = null
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }
} catch {
  // Ignore initialization errors during build
}

// Use Node.js runtime for Buffer support
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI is configured
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      )
    }

    const formData = await request.formData()
    const image = formData.get('image') as File
    const organizationId = formData.get('organization_id') as string
    const mode = formData.get('mode') as 'menu_recognition' | 'dish_identification' | 'general'

    if (!image || !organizationId) {
      return NextResponse.json(
        { error: 'Image and organization_id are required' },
        { status: 400 }
      )
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64Image = buffer.toString('base64')
    const imageUrl = `data:${image.type};base64,${base64Image}`

    // Get Supabase client
    const supabase = createClient()

    // Fetch organization
    const { data: organization } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', organizationId)
      .maybeSingle()

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Prepare prompt based on mode
    let systemPrompt = ''
    let userPrompt = ''

    if (mode === 'menu_recognition') {
      systemPrompt = `Sen bir menü okuma uzmanısın. Gönderilen menü fotoğrafından tüm yemekleri, fiyatları ve kategorileri çıkar.`
      userPrompt = `Bu ${organization.name} restoranının menüsü. Lütfen şu formatta JSON çıktı ver:
{
  "categories": [
    {
      "name": "Kategori Adı",
      "items": [
        {
          "name": "Yemek Adı",
          "description": "Açıklama (varsa)",
          "price": 99.99,
          "allergens": ["süt", "gluten"]
        }
      ]
    }
  ]
}

SADECE JSON formatında cevap ver, başka açıklama ekleme.`
    } else if (mode === 'dish_identification') {
      systemPrompt = `Sen bir yemek tanıma uzmanısın. Gönderilen yemek fotoğrafını analiz et.`
      userPrompt = `Bu yemek ne? Lütfen şu formatta JSON çıktı ver:
{
  "name": "Muhtemel yemek adı",
  "description": "Kısa açıklama",
  "ingredients": ["malzeme1", "malzeme2"],
  "cuisine": "Mutfak türü (Türk, İtalyan vs)",
  "confidence": 0.95
}

SADECE JSON formatında cevap ver.`
    } else {
      systemPrompt = `Sen bir görsel analiz asistanısın.`
      userPrompt = `Bu görseli analiz et ve detaylı açıkla.`
    }

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
      max_tokens: 1500,
      temperature: 0.3,
    })

    const aiResponse = response.choices[0]?.message?.content || ''

    // Parse JSON if mode is menu_recognition or dish_identification
    let parsedResponse
    if (mode === 'menu_recognition' || mode === 'dish_identification') {
      try {
        parsedResponse = JSON.parse(aiResponse)
      } catch {
        parsedResponse = { raw: aiResponse }
      }
    } else {
      parsedResponse = { description: aiResponse }
    }

    // Track analytics
    await supabase
      .from('analytics_events')
      .insert({
        organization_id: organizationId,
        event_type: 'ai_vision_analysis',
        event_data: { mode, image_size: bytes.byteLength },
      })

    return NextResponse.json({
      success: true,
      mode,
      result: parsedResponse,
    })
  } catch (error: any) {
    console.error('AI Vision Error:', error)
    return NextResponse.json(
      { error: error.message || 'Vision analysis failed' },
      { status: 500 }
    )
  }
}
