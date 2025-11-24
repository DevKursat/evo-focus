'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { ThemeToggle, LanguageToggle } from '@/components/shared/theme-language-toggle'

export default function PrivacyPage() {
  const { language } = useApp()

  const content = {
    tr: {
      title: 'Gizlilik Politikası',
      lastUpdated: 'Son Güncelleme: 19 Kasım 2024',
      sections: [
        {
          title: '1. Veri Sorumlusu',
          content: 'VERA QR platformu, toplanan kişisel verilerin işlenmesinden sorumlu veri sorumlusudur. KVKK ve GDPR kapsamında verileriniz güvenli bir şekilde saklanır.'
        },
        {
          title: '2. Toplanan Veriler',
          content: 'Platform kullanımı sırasında toplanan veriler: Ad-Soyad, E-posta adresi, İşletme bilgileri (logo, menü içeriği, QR kodlar), Kullanım istatistikleri (giriş zamanı, kullanım süresi), IP adresi ve tarayıcı bilgileri.'
        },
        {
          title: '3. Verilerin Kullanım Amaçları',
          content: 'Toplanan veriler şu amaçlarla kullanılır: Hizmet sunumu ve platform yönetimi, Kullanıcı desteği sağlanması, Fatura ve ödeme işlemleri, İstatistiksel analiz ve hizmet iyileştirme, Yasal yükümlülüklerin yerine getirilmesi.'
        },
        {
          title: '4. AI İşleme ve Veri Güvenliği',
          content: 'AI asistan özellikleri için menü içeriğiniz ve müşteri etkileşimleri işlenir. Bu veriler OpenAI gibi üçüncü taraf AI sağlayıcılarla paylaşılabilir. Kişisel tanımlayıcı bilgiler AI işleme için kullanılmaz. Tüm veriler şifreli bağlantılar üzerinden iletilir.'
        },
        {
          title: '5. Veri Saklama Süresi',
          content: 'Kullanıcı verileri hesap aktif olduğu sürece saklanır. Hesap kapatıldıktan sonra, yasal saklama yükümlülükleri hariç olmak üzere, veriler 90 gün içinde silinir. Finansal kayıtlar vergi mevzuatı gereği 10 yıl saklanır.'
        },
        {
          title: '6. Üçüncü Taraf Hizmetler',
          content: 'Platform şu üçüncü taraf hizmetleri kullanır: Supabase (Veritabanı ve Kimlik Doğrulama), OpenAI (AI Asistan), Vercel (Hosting). Bu hizmet sağlayıcılar kendi gizlilik politikalarına tabidirler.'
        },
        {
          title: '7. Kullanıcı Hakları (KVKK)',
          content: 'Kullanıcılar aşağıdaki haklara sahiptir: Kişisel verilerinizin işlenip işlenmediğini öğrenme, İşlenmişse bilgi talep etme, Düzeltme veya silme talep etme, Veri taşınabilirliği, İşlemeye itiraz etme. Taleplar için: privacy@veraqr.com'
        },
        {
          title: '8. Çerezler (Cookies)',
          content: 'Platform, kullanıcı deneyimini iyileştirmek için çerezler kullanır. Çerez Politikamızı inceleyin.'
        },
        {
          title: '9. Değişiklikler',
          content: 'Bu gizlilik politikası güncellenebilir. Önemli değişiklikler kayıtlı e-posta adresinize bildirilecektir.'
        },
        {
          title: '10. İletişim',
          content: 'Gizlilik ile ilgili sorularınız için: privacy@veraqr.com'
        }
      ]
    },
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated: November 19, 2024',
      sections: [
        {
          title: '1. Data Controller',
          content: 'VERA QR platform is the data controller responsible for processing collected personal data. Your data is securely stored under KVKK and GDPR.'
        },
        {
          title: '2. Collected Data',
          content: 'Data collected during platform usage: Name, Email address, Business information (logo, menu content, QR codes), Usage statistics (login time, usage duration), IP address and browser information.'
        },
        {
          title: '3. Purpose of Data Usage',
          content: 'Collected data is used for: Service provision and platform management, User support, Billing and payment processing, Statistical analysis and service improvement, Fulfillment of legal obligations.'
        },
        {
          title: '4. AI Processing and Data Security',
          content: 'Your menu content and customer interactions are processed for AI assistant features. This data may be shared with third-party AI providers like OpenAI. Personal identifiers are not used for AI processing. All data is transmitted over encrypted connections.'
        },
        {
          title: '5. Data Retention Period',
          content: 'User data is retained as long as the account is active. After account closure, except for legal retention obligations, data is deleted within 90 days. Financial records are retained for 10 years as per tax legislation.'
        },
        {
          title: '6. Third-Party Services',
          content: 'The platform uses the following third-party services: Supabase (Database and Authentication), OpenAI (AI Assistant), Vercel (Hosting). These service providers are subject to their own privacy policies.'
        },
        {
          title: '7. User Rights (KVKK)',
          content: 'Users have the following rights: Learn whether your personal data is processed, Request information if processed, Request correction or deletion, Data portability, Object to processing. For requests: privacy@veraqr.com'
        },
        {
          title: '8. Cookies',
          content: 'The platform uses cookies to improve user experience. Please review our Cookie Policy.'
        },
        {
          title: '9. Changes',
          content: 'This privacy policy may be updated. Significant changes will be notified to your registered email address.'
        },
        {
          title: '10. Contact',
          content: 'For privacy-related questions: privacy@veraqr.com'
        }
      ]
    }
  }

  const t = content[language]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
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

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold mb-4 dark:text-white">{t.title}</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">{t.lastUpdated}</p>

        <div className="space-y-8">
          {t.sections.map((section, index) => (
            <div key={index}>
              <h2 className="text-2xl font-semibold mb-3 dark:text-white">{section.title}</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">{section.content}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
