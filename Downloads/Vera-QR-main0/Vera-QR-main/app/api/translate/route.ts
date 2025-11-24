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

// Use Node.js runtime for OpenAI SDK
export const runtime = 'nodejs'

const SUPPORTED_LANGUAGES = {
  en: 'English',
  tr: 'Turkish',
  de: 'German',
  fr: 'French',
  es: 'Spanish',
  it: 'Italian',
  ru: 'Russian',
  ar: 'Arabic',
  zh: 'Chinese',
  ja: 'Japanese',
  ko: 'Korean',
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI is configured
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { text, target_language, organization_id, context = 'menu' } = body

    if (!text || !target_language || !organization_id) {
      return NextResponse.json(
        { error: 'text, target_language, and organization_id are required' },
        { status: 400 }
      )
    }

    if (!SUPPORTED_LANGUAGES[target_language as keyof typeof SUPPORTED_LANGUAGES]) {
      return NextResponse.json(
        { error: 'Unsupported language', supported: Object.keys(SUPPORTED_LANGUAGES) },
        { status: 400 }
      )
    }

    // Get Supabase client
    const supabase = createClient()

    // Check if organization exists
    const { data: organization } = await supabase
      .from('organizations')
      .select('name, settings')
      .eq('id', organization_id)
      .maybeSingle()

    if (!organization) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      )
    }

    // Prepare context-aware prompt
    let systemPrompt = ''
    if (context === 'menu') {
      systemPrompt = `Sen bir profesyonel restoran menüsü çevirmenisisin. Yemek isimlerini, malzemeleri ve açıklamaları ${SUPPORTED_LANGUAGES[target_language as keyof typeof SUPPORTED_LANGUAGES]} diline doğal ve lezzetli bir şekilde çevir. Kültürel bağlamı koru ama anlaşılır yap.`
    } else if (context === 'chat') {
      systemPrompt = `Sen bir konuşma çevirmenisisin. Metni ${SUPPORTED_LANGUAGES[target_language as keyof typeof SUPPORTED_LANGUAGES]} diline doğal ve günlük bir dille çevir.`
    } else {
      systemPrompt = `Sen profesyonel bir çevirmensin. Metni ${SUPPORTED_LANGUAGES[target_language as keyof typeof SUPPORTED_LANGUAGES]} diline çevir.`
    }

    // Call OpenAI for translation
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: `Şu metni çevir:\n\n${text}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    })

    const translatedText = response.choices[0]?.message?.content || text

    // Track analytics
    await supabase
      .from('analytics_events')
      .insert({
        organization_id,
        event_type: 'translation_request',
        event_data: {
          target_language,
          context,
          char_count: text.length,
        },
      })

    return NextResponse.json({
      success: true,
      original: text,
      translated: translatedText,
      target_language,
      source_language: 'auto',
    })
  } catch (error: any) {
    console.error('Translation Error:', error)
    return NextResponse.json(
      { error: error.message || 'Translation failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to list supported languages
export async function GET() {
  return NextResponse.json({
    supported_languages: SUPPORTED_LANGUAGES,
  })
}
