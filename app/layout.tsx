import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ChatWidget from '../components/ChatWidget'

export const metadata: Metadata = {
  title: {
    template: '%s | HealthInsuranceRenew',
    default: 'HealthInsuranceRenew — ACA Health Insurance Intelligence',
  },
  description:
    'Compare ACA health insurance plans, calculate subsidies, and understand your coverage options. Data from CMS for all 50 states.',
  metadataBase: new URL('https://healthinsurancerenew.com'),
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
  },
  robots: { index: true, follow: true },
  openGraph: {
    siteName: 'HealthInsuranceRenew',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-default.png',
        width: 1200,
        height: 630,
        alt: 'HealthInsuranceRenew — Marketplace Health Insurance Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/og-default.png'],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Public+Sans:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-page text-ink font-sans antialiased" style={{ fontSize: 15, lineHeight: 1.7 }}>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
        <ChatWidget />
        {process.env.NEXT_PUBLIC_GA4_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA4_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA4_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  )
}
