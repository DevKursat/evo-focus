'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { QrCode, Brain, Utensils, TrendingUp, Shield, Zap } from 'lucide-react'
import { ThemeToggle, LanguageToggle } from '@/components/shared/theme-language-toggle'
import { useApp } from '@/lib/app-context'

export default function HomePage() {
  const { t, language } = useApp()

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="border-b bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <QrCode className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">VERAQR</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="#features" className="hidden md:inline text-sm hover:text-primary transition">
              {t.landing.features}
            </Link>
            <Link href="#pricing" className="hidden md:inline text-sm hover:text-primary transition">
              {t.landing.pricing}
            </Link>
            <ThemeToggle />
            <LanguageToggle />
            <Button asChild>
              <Link href="/auth/login">{t.landing.login}</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          {t.landing.title}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t.landing.subtitle}
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/auth/login">{t.landing.login}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#features">{t.landing.moreInfo}</Link>
          </Button>
        </div>
        <div className="mt-16 relative mx-auto max-w-4xl aspect-[16/9]">
          <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-gray-900 via-transparent to-transparent z-10" />
          <Image
            src="https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80"
            alt="QR Menu Demo"
            fill
            className="rounded-lg shadow-2xl object-cover"
            priority
          />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">
          {t.landing.features}
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <Brain className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="dark:text-white">AI Menü Asistanı</CardTitle>
              <CardDescription className="dark:text-gray-300">
                GPT-4 destekli asistan, müşterilerinize ürün önerir ve sorularını yanıtlar
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <QrCode className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="dark:text-white">QR Kod Sistemi</CardTitle>
              <CardDescription className="dark:text-gray-300">
                Her masa için özel QR kod. Müşteriler telefonu ile okutup hemen menüyü görür
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <Utensils className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="dark:text-white">Dinamik Menü</CardTitle>
              <CardDescription className="dark:text-gray-300">
                Ürünleri anında güncelleyin, stok kontrolü yapın, kategori düzenleyin
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <TrendingUp className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="dark:text-white">Analitik & Raporlar</CardTitle>
              <CardDescription className="dark:text-gray-300">
                Satış raporları, popüler ürünler, yoğun saatler gibi detaylı analizler
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="dark:text-white">Güvenli & Ölçeklenebilir</CardTitle>
              <CardDescription className="dark:text-gray-300">
                Enterprise seviye güvenlik, sınırsız masa ve ürün desteği
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="dark:bg-gray-800 dark:border-gray-700">
            <CardHeader>
              <Zap className="h-10 w-10 text-primary mb-2" />
              <CardTitle className="dark:text-white">Hızlı Kurulum</CardTitle>
              <CardDescription className="dark:text-gray-300">
                5 dakikada hesap açın, menünüzü yükleyin ve QR kodlarınızı yazdırın
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-12">
          Fiyatlandırma
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Starter</CardTitle>
              <CardDescription>Küçük işletmeler için</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">₺299</span>
                <span className="text-muted-foreground">/ay</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ 20 masa</li>
                <li>✓ Sınırsız ürün</li>
                <li>✓ AI Asistan (1000 mesaj/ay)</li>
                <li>✓ Temel raporlar</li>
                <li>✓ Email destek</li>
              </ul>
              <Button className="w-full mt-6" variant="outline" asChild>
                <Link href="/auth/login">Giriş Yap</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary shadow-lg scale-105">
            <CardHeader>
              <CardTitle>Pro</CardTitle>
              <CardDescription>Orta ölçekli restoranlar</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">₺599</span>
                <span className="text-muted-foreground">/ay</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ 50 masa</li>
                <li>✓ Sınırsız ürün</li>
                <li>✓ AI Asistan (5000 mesaj/ay)</li>
                <li>✓ Gelişmiş raporlar</li>
                <li>✓ Kampanya yönetimi</li>
                <li>✓ Öncelikli destek</li>
              </ul>
              <Button className="w-full mt-6" asChild>
                <Link href="/auth/login">Giriş Yap</Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Enterprise</CardTitle>
              <CardDescription>Restoran zincirleri</CardDescription>
              <div className="mt-4">
                <span className="text-4xl font-bold">Özel</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>✓ Sınırsız masa</li>
                <li>✓ Sınırsız ürün</li>
                <li>✓ Sınırsız AI mesaj</li>
                <li>✓ Özel AI eğitimi</li>
                <li>✓ API erişimi</li>
                <li>✓ Çoklu lokasyon</li>
                <li>✓ 7/24 destek</li>
              </ul>
              <Button className="w-full mt-6" variant="outline" asChild>
                <Link href="/auth/login">Giriş Yap</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white dark:bg-gray-900 dark:border-gray-700">
        <div className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="h-6 w-6 dark:text-white" />
                <span className="font-bold dark:text-white">VERAQR</span>
              </div>
              <p className="text-sm text-muted-foreground dark:text-gray-400">
                AI destekli QR menü sistemi ile restoranınızı dijitalleştirin
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 dark:text-white">Ürün</h4>
              <ul className="space-y-2 text-sm text-muted-foreground dark:text-gray-400">
                <li><Link href="#features" className="hover:text-primary">Özellikler</Link></li>
                <li><Link href="#pricing" className="hover:text-primary">Fiyatlandırma</Link></li>
                <li><Link href="/docs" className="hover:text-primary">Dokümantasyon</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 dark:text-white">{language === 'tr' ? 'Şirket' : 'Company'}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground dark:text-gray-400">
                <li><Link href="/about" className="hover:text-primary">{language === 'tr' ? 'Hakkımızda' : 'About'}</Link></li>
                <li><Link href="/contact" className="hover:text-primary">{language === 'tr' ? 'İletişim' : 'Contact'}</Link></li>
                <li><Link href="/blog" className="hover:text-primary">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 dark:text-white">{language === 'tr' ? 'Yasal' : 'Legal'}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground dark:text-gray-400">
                <li><Link href="/legal/privacy" className="hover:text-primary">{language === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}</Link></li>
                <li><Link href="/legal/terms" className="hover:text-primary">{language === 'tr' ? 'Kullanım Koşulları' : 'Terms of Service'}</Link></li>
                <li><Link href="/legal/cookies" className="hover:text-primary">{language === 'tr' ? 'Çerez Politikası' : 'Cookie Policy'}</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t dark:border-gray-700 text-center text-sm text-muted-foreground dark:text-gray-400">
            © 2024 VERAQR. {language === 'tr' ? 'Tüm hakları saklıdır.' : 'All rights reserved.'}
          </div>
        </div>
      </footer>
    </div>
  )
}
