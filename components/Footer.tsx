'use client'

import { useState } from 'react'

const currentYear = new Date().getFullYear()

const licensedStates = [
  { name: 'Alabama', abbr: 'AL', slug: 'alabama' },
  { name: 'California', abbr: 'CA', slug: 'california' },
  { name: 'Georgia', abbr: 'GA', slug: 'georgia' },
  { name: 'Iowa', abbr: 'IA', slug: 'iowa' },
  { name: 'Kansas', abbr: 'KS', slug: 'kansas' },
  { name: 'Maryland', abbr: 'MD', slug: 'maryland' },
  { name: 'Michigan', abbr: 'MI', slug: 'michigan' },
  { name: 'Missouri', abbr: 'MO', slug: 'missouri' },
  { name: 'Mississippi', abbr: 'MS', slug: 'mississippi' },
  { name: 'New Mexico', abbr: 'NM', slug: 'new-mexico' },
  { name: 'Ohio', abbr: 'OH', slug: 'ohio' },
  { name: 'Oregon', abbr: 'OR', slug: 'oregon' },
  { name: 'South Carolina', abbr: 'SC', slug: 'south-carolina' },
  { name: 'Tennessee', abbr: 'TN', slug: 'tennessee' },
  { name: 'Texas', abbr: 'TX', slug: 'texas' },
  { name: 'Utah', abbr: 'UT', slug: 'utah' },
  { name: 'Virginia', abbr: 'VA', slug: 'virginia' },
  { name: 'Washington', abbr: 'WA', slug: 'washington' },
]

const coverageDataLinks = [
  { label: 'Plans', url: '/states' },
  { label: 'Subsidies', url: '/subsidies' },
  { label: 'Rates', url: '/rates' },
  { label: 'Drug Lookup', url: '/formulary' },
  { label: 'Dental', url: '/dental' },
  { label: 'Billing', url: '/billing' },
  { label: 'Life Events', url: '/life-events' },
  { label: 'Enhanced Credits', url: '/enhanced-credits' },
  { label: 'FAQ', url: '/faq' },
]

const resourceLinks = [
  { label: 'Guides', url: '/guides' },
  { label: 'Tools', url: '/tools' },
  { label: 'States', url: '/states' },
  { label: 'Glossary', url: '/glossary' },
  { label: 'Lost Your Job?', url: '/lost-job-health-insurance-2026' },
  { label: 'Self-Employed Coverage', url: '/self-employed-health-insurance-2026' },
]

const companyLinks = [
  { label: 'About', url: '/about' },
  { label: 'Contact', url: '/contact' },
  { label: 'Privacy', url: '/privacy' },
  { label: 'Terms', url: '/terms' },
  { label: 'Editorial Policy', url: '/editorial-policy' },
]

function AccordionSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-slate-100">
      <button
        className="w-full flex items-center justify-between py-4 text-left"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="text-[#0B1F3B] font-semibold text-sm uppercase tracking-wider">{title}</span>
        <svg
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  )
}

function LinkList({ links }: { links: { label: string; url: string }[] }) {
  return (
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.url}>
          <a href={link.url} className="text-sm text-slate-600 hover:text-[#0B1F3B] transition-colors">
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Desktop 4-column grid */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-10 mb-10">
          <div>
            <h3 className="text-[#0B1F3B] font-semibold text-sm uppercase tracking-wider mb-4">Coverage Data</h3>
            <LinkList links={coverageDataLinks} />
          </div>
          <div>
            <h3 className="text-[#0B1F3B] font-semibold text-sm uppercase tracking-wider mb-4">Resources</h3>
            <LinkList links={resourceLinks} />
          </div>
          <div>
            <h3 className="text-[#0B1F3B] font-semibold text-sm uppercase tracking-wider mb-4">Company</h3>
            <LinkList links={companyLinks} />
          </div>
          <div>
            <h3 className="text-[#0B1F3B] font-semibold text-sm uppercase tracking-wider mb-4">Trust &amp; Compliance</h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#0B1F3B]">Licensed U.S. Health Insurance Agent</p>
                <p className="text-sm text-slate-600 mt-1">NPN: 7578729</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">CMS Marketplace Certified</p>
                <p className="text-xs text-slate-500 mt-1">Recognized for enrollment excellence during the 2023 Open Enrollment Period.</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Serving clients in {licensedStates.length} states: {licensedStates.map((s) => s.abbr).join(', ')}.
                </p>
              </div>
              <ul className="space-y-2 pt-2 border-t border-slate-100">
                <li><a href="/circle-of-champions" className="text-sm text-slate-600 hover:text-[#0B1F3B] transition-colors">Circle of Champions Recognition</a></li>
                <li><a href="/data-methodology" className="text-sm text-slate-600 hover:text-[#0B1F3B] transition-colors">Data &amp; Methodology</a></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Mobile accordion */}
        <div className="lg:hidden space-y-0 mb-8">
          <AccordionSection title="Coverage Data">
            <LinkList links={coverageDataLinks} />
          </AccordionSection>
          <AccordionSection title="Resources">
            <LinkList links={resourceLinks} />
          </AccordionSection>
          <AccordionSection title="Company">
            <LinkList links={companyLinks} />
          </AccordionSection>
          <AccordionSection title="Trust & Compliance">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-[#0B1F3B]">Licensed U.S. Health Insurance Agent</p>
              <p className="text-sm text-slate-600">NPN: 7578729</p>
              <p className="text-xs text-slate-500">CMS Marketplace Certified. Recognized for enrollment excellence during the 2023 Open Enrollment Period.</p>
              <p className="text-xs text-slate-500">Serving clients in {licensedStates.length} states.</p>
              <a href="/circle-of-champions" className="block text-sm text-slate-600 hover:text-[#0B1F3B] transition-colors">Circle of Champions Recognition</a>
              <a href="/data-methodology" className="block text-sm text-slate-600 hover:text-[#0B1F3B] transition-colors">Data &amp; Methodology</a>
            </div>
          </AccordionSection>
        </div>

        {/* Bottom disclaimer */}
        <div className="border-t border-slate-200 pt-8">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-6">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-600">Important:</strong> HealthInsuranceRenew.com is not a government website and is not affiliated with Healthcare.gov or any government agency. This website is operated by a licensed health insurance agent (NPN: 7578729) and provides educational information about health insurance options. We may receive compensation from insurance carriers when you enroll through a licensed agent. Information on this site is for educational purposes only and does not constitute legal, tax, or benefits advice.
            </p>
          </div>
          <p className="text-xs text-slate-400 text-center">
            &copy; {currentYear} HealthInsuranceRenew.com. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
