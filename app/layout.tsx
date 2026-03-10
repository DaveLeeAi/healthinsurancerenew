import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: {
    template: '%s | HealthInsuranceRenew',
    default: 'HealthInsuranceRenew — ACA Health Insurance Intelligence',
  },
  description:
    'Compare ACA health insurance plans, calculate subsidies, and understand your coverage options. Data from CMS for all 50 states.',
  metadataBase: new URL('https://healthinsurancerenew.com'),
  robots: { index: true, follow: true },
  openGraph: {
    siteName: 'HealthInsuranceRenew',
    locale: 'en_US',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-white text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  )
}
