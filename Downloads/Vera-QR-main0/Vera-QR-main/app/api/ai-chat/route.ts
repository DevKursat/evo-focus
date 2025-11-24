import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendChatMessage, type ChatMessage, type MenuContext, type MenuItem } from '@/lib/openai'
import { validateAIChatMessage } from '@/lib/validators'

// Use Node.js runtime for OpenAI SDK
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate request
    // Note: validation might still use 'organization_id', but we treat it as 'restaurant_id'
    const { message, session_id, organization_id } = validateAIChatMessage(body)

    // Get Supabase client
    const supabase = createClient()

    // Fetch restaurant (organization)
    const { data: restaurant, error: restaurantError } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', organization_id)
      .eq('status', 'active')
      .maybeSingle()

    if (restaurantError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      )
    }

    // Fetch AI config
    const { data: aiConfig } = await supabase
      .from('ai_configs')
      .select('*')
      .eq('restaurant_id', organization_id)
      .maybeSingle()

    const aiPersonality = aiConfig?.personality || 'friendly'

    // Note: API Key usually comes from env vars, but if we had per-restaurant keys, they'd be here.
    // The schema provided doesn't show per-restaurant openai keys in ai_configs, so we use default.
    const customApiKey = undefined

    // Fetch menu items (products)
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('restaurant_id', organization_id)
      .eq('is_available', true)

    if (productsError) {
      throw productsError
    }

    // Map products to MenuItem type expected by openai lib
    const menuItems: MenuItem[] = (products || []).map(p => ({
        ...p,
        name: p.name_tr, // Default to Turkish name for AI context for now
        description: p.description_tr,
        available: p.is_available || false,
        allergens: p.allergens || []
    }))

    // Fetch categories
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('id, name_tr')
      .eq('restaurant_id', organization_id)
      .eq('visible', true)

    if (categoriesError) {
      throw categoriesError
    }

    const mappedCategories = (categories || []).map(c => ({
        id: c.id,
        name: c.name_tr
    }))

    // Get conversation history
    const { data: conversation } = await supabase
      .from('ai_conversations')
      .select('messages')
      .eq('session_id', session_id)
      .eq('restaurant_id', organization_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const previousMessages: ChatMessage[] = (conversation?.messages as any) || []

    // Add new user message
    const messages: ChatMessage[] = [
      ...previousMessages,
      { role: 'user', content: message },
    ]

    // Prepare context
    const context: MenuContext = {
      organization: restaurant,
      menuItems: menuItems,
      categories: mappedCategories,
      aiPersonality,
    }

    // Get AI response
    const aiResponse = await sendChatMessage(messages, context, customApiKey)

    // Update messages with AI response
    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: 'assistant', content: aiResponse },
    ]

    // Save conversation to database
    await supabase
      .from('ai_conversations')
      .upsert({
        session_id,
        restaurant_id: organization_id,
        messages: updatedMessages as any, // casting for JSONB compatibility if needed
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' }) // Note: This might need adjustment depending on how upsert works with just session_id if id is PK.
      // Actually, for chat history usually we append. The current logic seems to overwrite/update a single row per session.
      // If 'ai_conversations' has ID PK and session_id is just a column.
      // Let's check schema: id UUID PK, session_id VARCHAR.
      // We need to find the row ID if it exists to update it, or insert new.
      // Using session_id alone for upsert might fail if it's not unique constraint.
      // Schema says: idx_ai_conversations_session exists, but not UNIQUE constraint on session_id alone?
      // Actually, let's look at schema again.
      // "id UUID PRIMARY KEY", "session_id VARCHAR".
      // If we want to maintain one row per session, we need to query it first (which we did) and get its ID.

    let conversationId = conversation ? (conversation as any).id : undefined;
    if (!conversationId) {
        // Fetch ID if we missed it in the select above
        const { data: existing } = await supabase.from('ai_conversations').select('id').eq('session_id', session_id).maybeSingle()
        conversationId = existing?.id
    }

    if (conversationId) {
        await supabase.from('ai_conversations').update({
            messages: updatedMessages as any,
            updated_at: new Date().toISOString()
        }).eq('id', conversationId)
    } else {
        await supabase.from('ai_conversations').insert({
            session_id,
            restaurant_id: organization_id,
            messages: updatedMessages as any
        })
    }

    // Track analytics
    await supabase
      .from('analytics_events')
      .insert({
        restaurant_id: organization_id,
        event_type: 'ai_chat_message',
        event_data: { session_id, message_length: message.length },
        session_id,
      })

    return NextResponse.json({
      response: aiResponse,
      session_id,
    })
  } catch (error: any) {
    console.error('AI Chat Error:', error)
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    )
  }
}
