'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { Send, X, Loader2, ShoppingCart, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import type { Database } from '@/lib/supabase/types'
import { formatCurrency } from '@/lib/utils'

type Restaurant = Database['public']['Tables']['restaurants']['Row']
type Product = Database['public']['Tables']['products']['Row']
type AIConfig = Database['public']['Tables']['ai_configs']['Row']

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface Props {
  organization: Restaurant
  sessionId: string
  onClose: () => void
  onAddToCart?: (item: any) => void
  aiConfig: AIConfig | null
  products: Product[]
}

export default function AIAssistantChat({ organization, sessionId, onClose, onAddToCart, aiConfig, products }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isTypingWelcome, setIsTypingWelcome] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Initialize Welcome Message
  useEffect(() => {
    const welcomeText = aiConfig?.welcome_message_tr ||
      `Merhaba! ${organization.name} AI asistanınız olarak size yardımcı olmaktan mutluluk duyarım. Menümüz hakkında sorularınızı yanıtlayabilirim ve sipariş vermenize yardımcı olabilirim.`

    // Simulate typing delay
    const timer = setTimeout(() => {
      setMessages([{
        role: 'assistant',
        content: welcomeText,
        timestamp: new Date().toISOString()
      }])
      setIsTypingWelcome(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [aiConfig, organization.name])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTypingWelcome])

  // Auto-focus input after welcome message
  useEffect(() => {
    if (!isTypingWelcome && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isTypingWelcome])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          session_id: sessionId,
          organization_id: organization.id,
        }),
      })

      if (!response.ok) {
        throw new Error('AI response failed')
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date().toISOString(),
      }

      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      console.error('AI chat error:', error)
      toast({
        title: 'Hata',
        description: 'AI asistan şu anda yanıt veremiyor. Lütfen tekrar deneyin.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Helper to extract product ID from [RECOMMEND: ID] tag
  const extractRecommendation = (content: string): { text: string, productId: string | null } => {
    const match = content.match(/\[RECOMMEND: ([a-f0-9-]+)\]/i)
    if (match) {
      return {
        text: content.replace(match[0], '').trim(),
        productId: match[1]
      }
    }
    return { text: content, productId: null }
  }

  const renderMessageContent = (content: string) => {
    const { text, productId } = extractRecommendation(content)

    let recommendedProduct = null
    if (productId) {
      recommendedProduct = products.find(p => p.id === productId)
    }

    return (
      <div className="space-y-3">
        <p className="text-sm whitespace-pre-wrap">{text}</p>
        {recommendedProduct && (
          <Card className="overflow-hidden border-primary/20 bg-background/50">
            <div className="flex p-3 gap-3">
              {recommendedProduct.image_url ? (
                <div className="relative w-16 h-16 rounded-md overflow-hidden shrink-0">
                  <Image
                    src={recommendedProduct.image_url}
                    alt={recommendedProduct.name_tr}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center shrink-0 text-xs text-muted-foreground">
                  Görsel Yok
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{recommendedProduct.name_tr}</h4>
                <p className="text-xs text-muted-foreground line-clamp-1">{recommendedProduct.description_tr}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-sm text-primary">
                    {formatCurrency(recommendedProduct.price)}
                  </span>
                  <Button
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => onAddToCart?.({
                      ...recommendedProduct,
                      name: recommendedProduct.name_tr,
                      description: recommendedProduct.description_tr,
                      allergens: recommendedProduct.allergens || []
                    })}
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" />
                    Ekle
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </div>
    )
  }

  return (
    <Card className="flex flex-col shadow-lg animate-in slide-in-from-bottom-5 duration-300 fixed inset-x-0 bottom-0 top-16 md:right-4 md:left-auto md:w-96 md:top-20 md:bottom-4 z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-primary/5">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center relative">
            <span className="text-xl">🤖</span>
            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></span>
          </div>
          <div>
            <h3 className="font-semibold">AI Asistan</h3>
            <p className="text-xs text-muted-foreground">
              {aiConfig?.personality === 'fun' ? 'Eğlenceli Menü Uzmanı' : 'Menü Uzmanı'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isTypingWelcome && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg rounded-tl-none px-4 py-3 shadow-sm max-w-[85%]">
              <div className="flex gap-1 h-4 items-center">
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
              </div>
            </div>
          </div>
        )}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${message.role === 'user'
                ? 'bg-primary text-primary-foreground rounded-tr-none'
                : 'bg-muted rounded-tl-none'
                }`}
            >
              {renderMessageContent(message.content)}
              <p className={`text-[10px] mt-1 text-right ${message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                {new Date(message.timestamp).toLocaleTimeString('tr-TR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg rounded-tl-none px-4 py-3 shadow-sm">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background/50 backdrop-blur">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Bir şeyler sorun..."
            disabled={isLoading}
            className="rounded-full pl-4 border-input focus-visible:ring-1"
          />
          <Button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            size="icon"
            className="rounded-full"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
