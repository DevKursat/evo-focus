'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useApp } from '@/lib/app-context'
import { ThemeToggle, LanguageToggle } from '@/components/shared/theme-language-toggle'

export default function CookiesPage() {
  const { language } = useApp()

  const content = {
    tr: {
      title: 'Çerez Politikası',
      lastUpdated: 'Son Güncelleme: 19 Kasım 2024',
      sections: [
        {
          title: '1. Çerez Nedir?',
          content: 'Çerezler, web sitelerinin tarayıcınızda sakladığı küçük metin dosyalarıdır. Bu dosyalar, tercihlerinizi hatırlamak ve kullanıcı deneyimini iyileştirmek için kullanılır.'
        },
        {
          title: '2. Kullandığımız Çerezler',
          content: 'VERA QR platformu şu çerez türlerini kullanır:\n\nZorunlu Çerezler: Platformun çalışması için gereklidir (oturum yönetimi, güvenlik).\n\nTercih Çerezleri: Dil seçimi, tema tercihi gibi kullanıcı ayarlarını saklar.\n\nAnalitik Çerezler: Platform kullanımını analiz eder ve hizmet kalitesini artırır.\n\nFonksiyonel Çerezler: Gelişmiş özelliklerin çalışmasını sağlar.'
        },
        {
          title: '3. Saklanan Bilgiler',
          content: 'Çerezler aracılığıyla saklanan bilgiler:\n- Oturum kimliği (auth token)\n- Dil tercihi (tr/en)\n- Tema tercihi (light/dark)\n- Kullanım istatistikleri (anonim)'
        },
        {
          title: '4. Çerez Kullanım Amaçları',
          content: 'Çerezler şu amaçlarla kullanılır:\n- Kullanıcı oturumunu sürdürme\n- Tercih edilen dil ve temayı hatırlama\n- Platform performansını izleme\n- Güvenlik önlemleri uygulama\n- Kullanıcı deneyimini kişiselleştirme'
        },
        {
          title: '5. Üçüncü Taraf Çerezleri',
          content: 'Platform, şu üçüncü taraf hizmetlerinin çerezlerini kullanabilir:\n- Supabase (Kimlik doğrulama)\n- Vercel Analytics (Performans izleme)\nBu hizmetler kendi çerez politikalarına tabidirler.'
        },
        {
          title: '6. Çerezleri Yönetme',
          content: 'Çerezleri tarayıcı ayarlarından yönetebilirsiniz. Çerezleri devre dışı bırakmanız durumunda platformun bazı özellikleri çalışmayabilir.\n\nTarayıcı Ayarları:\n- Chrome: Ayarlar > Gizlilik ve güvenlik > Çerezler\n- Firefox: Seçenekler > Gizlilik ve güvenlik\n- Safari: Tercihler > Gizlilik'
        },
        {
          title: '7. Çerez Saklama Süresi',
          content: 'Oturum Çerezleri: Tarayıcı kapatıldığında silinir.\nKalıcı Çerezler: Tercihler için 1 yıl, analytics için 2 yıl saklanır.'
        },
        {
          title: '8. Değişiklikler',
          content: 'Bu çerez politikası güncellenebilir. Önemli değişiklikler platform üzerinden duyurulacaktır.'
        },
        {
          title: '9. İletişim',
          content: 'Çerezler hakkında sorularınız için: privacy@veraqr.com'
        }
      ]
    },
    en: {
      title: 'Cookie Policy',
      lastUpdated: 'Last Updated: November 19, 2024',
      sections: [
        {
          title: '1. What are Cookies?',
          content: 'Cookies are small text files that websites store in your browser. These files are used to remember your preferences and improve user experience.'
        },
        {
          title: '2. Cookies We Use',
          content: 'VERA QR platform uses the following types of cookies:\n\nEssential Cookies: Required for platform operation (session management, security).\n\nPreference Cookies: Store user settings like language choice and theme preference.\n\nAnalytics Cookies: Analyze platform usage and improve service quality.\n\nFunctional Cookies: Enable advanced features to work.'
        },
        {
          title: '3. Stored Information',
          content: 'Information stored through cookies:\n- Session ID (auth token)\n- Language preference (tr/en)\n- Theme preference (light/dark)\n- Usage statistics (anonymous)'
        },
        {
          title: '4. Cookie Usage Purposes',
          content: 'Cookies are used for:\n- Maintaining user session\n- Remembering preferred language and theme\n- Monitoring platform performance\n- Implementing security measures\n- Personalizing user experience'
        },
        {
          title: '5. Third-Party Cookies',
          content: 'The platform may use cookies from the following third-party services:\n- Supabase (Authentication)\n- Vercel Analytics (Performance monitoring)\nThese services are subject to their own cookie policies.'
        },
        {
          title: '6. Managing Cookies',
          content: 'You can manage cookies through your browser settings. Disabling cookies may cause some platform features to not work.\n\nBrowser Settings:\n- Chrome: Settings > Privacy and security > Cookies\n- Firefox: Options > Privacy and security\n- Safari: Preferences > Privacy'
        },
        {
          title: '7. Cookie Retention Period',
          content: 'Session Cookies: Deleted when browser is closed.\nPersistent Cookies: Stored for 1 year for preferences, 2 years for analytics.'
        },
        {
          title: '8. Changes',
          content: 'This cookie policy may be updated. Significant changes will be announced on the platform.'
        },
        {
          title: '9. Contact',
          content: 'For questions about cookies: privacy@veraqr.com'
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
