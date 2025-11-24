'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { ThemeToggle, LanguageToggle } from '@/components/shared/theme-language-toggle'

export default function TermsPage() {
  const { language } = useApp()

  const content = {
    tr: {
      title: 'Kullanım Koşulları',
      lastUpdated: 'Son Güncelleme: 19 Kasım 2024',
      sections: [
        {
          title: '1. Hizmet Tanımı',
          content: 'VERA QR, restoranlar ve işletmeler için AI destekli dijital menü yönetim platformudur. Platform, QR kod tabanlı menü görüntüleme, AI asistan entegrasyonu ve sipariş yönetimi hizmetleri sunar.'
        },
        {
          title: '2. Kullanıcı Sorumlulukları',
          content: 'Platform kullanıcıları, yükledikleri içeriklerden (menü öğeleri, görseller, açıklamalar) sorumludur. Kullanıcılar, telif hakkı ihlali veya yanıltıcı bilgi içeren içerik yüklememeyi taahhüt eder.'
        },
        {
          title: '3. AI Destekli İçerik Uyarısı',
          content: 'VERA QR platformunda sunulan AI asistan önerileri, ürün açıklamaları ve diğer AI tarafından üretilen içerikler bilgilendirme amaçlıdır. Kullanıcılar, özellikle alerjen bilgileri konusunda kendi kontrol ve doğrulamalarını yapmalıdır. Platform, AI tarafından üretilen içeriklerin doğruluğunu garanti etmez.'
        },
        {
          title: '4. Gizlilik ve Veri Koruma',
          content: 'Kullanıcı verileri KVKK (Kişisel Verilerin Korunması Kanunu) ve GDPR uyumlu olarak işlenir ve saklanır. Detaylı bilgi için Gizlilik Politikamızı inceleyiniz.'
        },
        {
          title: '5. Hizmet Değişiklikleri',
          content: 'VERA QR, hizmet şartlarını ve özelliklerini önceden bildirimde bulunarak değiştirme hakkını saklı tutar. Önemli değişiklikler kayıtlı e-posta adresine bildirilecektir.'
        },
        {
          title: '6. Ücretlendirme',
          content: 'Platform abonelik bazlı çalışır. Ücretler seçilen plan ve kullanım süresine göre belirlenir. Fiyatlandırma değişiklikleri mevcut abonelik dönemini etkilemez.'
        },
        {
          title: '7. Hizmetin Sonlandırılması',
          content: 'Kullanıcılar hesaplarını istedikleri zaman sonlandırabilir. Platform, hizmet şartlarını ihlal eden hesapları askıya alma veya sonlandırma hakkını saklı tutar.'
        },
        {
          title: '8. Sorumluluk Reddi',
          content: 'VERA QR, hizmet kesintileri, veri kaybı veya üçüncü taraf hizmet sağlayıcılardan kaynaklanan sorunlardan sorumlu tutulamaz. Platform "olduğu gibi" sunulmaktadır.'
        },
        {
          title: '9. İletişim',
          content: 'Sorularınız için: support@veraqr.com'
        }
      ]
    },
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last Updated: November 19, 2024',
      sections: [
        {
          title: '1. Service Definition',
          content: 'VERA QR is an AI-powered digital menu management platform for restaurants and businesses. The platform provides QR code-based menu viewing, AI assistant integration, and order management services.'
        },
        {
          title: '2. User Responsibilities',
          content: 'Platform users are responsible for the content they upload (menu items, images, descriptions). Users agree not to upload content that infringes copyright or contains misleading information.'
        },
        {
          title: '3. AI-Generated Content Disclaimer',
          content: 'AI assistant recommendations, product descriptions, and other AI-generated content provided on the VERA QR platform are for informational purposes only. Users must perform their own verification and controls, especially regarding allergen information. The platform does not guarantee the accuracy of AI-generated content.'
        },
        {
          title: '4. Privacy and Data Protection',
          content: 'User data is processed and stored in compliance with KVKK (Personal Data Protection Law) and GDPR. Please review our Privacy Policy for detailed information.'
        },
        {
          title: '5. Service Changes',
          content: 'VERA QR reserves the right to modify service terms and features with prior notice. Significant changes will be communicated to the registered email address.'
        },
        {
          title: '6. Pricing',
          content: 'The platform operates on a subscription basis. Fees are determined based on the selected plan and usage period. Pricing changes do not affect the current subscription period.'
        },
        {
          title: '7. Service Termination',
          content: 'Users can terminate their accounts at any time. The platform reserves the right to suspend or terminate accounts that violate the terms of service.'
        },
        {
          title: '8. Disclaimer of Liability',
          content: 'VERA QR cannot be held liable for service interruptions, data loss, or issues arising from third-party service providers. The platform is provided "as is".'
        },
        {
          title: '9. Contact',
          content: 'For questions: support@veraqr.com'
        }
      ]
    }
  }

  const t = content[language]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <header className="border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {language === 'tr' ? 'Ana Sayfa' : 'Home'}
            </Button>
          </Link>
          <div className="flex gap-2">
            <ThemeToggle />
            <LanguageToggle />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4 dark:text-white">{t.title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">{t.lastUpdated}</p>

        <div className="space-y-8">
          {t.sections.map((section, index) => (
            <div key={index}>
              <h2 className="text-2xl font-semibold mb-3 dark:text-white">{section.title}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
