'use client'

import { useState } from 'react'
import Link from 'next/link'

const navLinks = [
  { label: 'Guides', href: '/guides' },
  { label: 'Tools', href: '/tools' },
  { label: 'States', href: '/states' },
  { label: 'Plans', href: '/plans' },
  { label: 'Subsidies', href: '/subsidies' },
  { label: 'Drug Lookup', href: '/formulary' },
  { label: 'Dental', href: '/dental' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-900 font-bold text-lg tracking-tight hover:text-primary-600 transition-colors"
          >
            <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" className="fill-primary-500" />
              <path d="M10 10v12h4v-4h4v4h4V10h-4v4h-4v-4z" fill="white" />
            </svg>
            <span className="hidden sm:inline">HealthInsuranceRenew</span>
          </Link>

          <div className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-600">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.href} className="hover:text-primary-600 transition-colors">
                {link.label}
              </Link>
            ))}
            <Link
              href="/contact"
              className="relative z-20 inline-flex items-center px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
            >
              Get Help
            </Link>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden pb-4 border-t border-slate-100 mt-2 pt-4">
            <div className="flex flex-col gap-3 text-sm font-medium text-slate-600">
              {navLinks.map((link) => (
                <Link key={link.label} href={link.href} className="hover:text-primary-600 transition-colors py-1">
                  {link.label}
                </Link>
              ))}
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700 transition-colors mt-2"
              >
                Get Help
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
