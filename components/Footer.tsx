'use client'

import { useState } from 'react'
import config from '../data/config/config.json'

const currentYear = new Date().getFullYear()
const { licensedStates, operator } = config

const coverageDataLinks = [
  { label: 'Plans', url: '/plans' },
  { label: 'Subsidies', url: '/subsidies' },
  { label: 'Rates', url: '/rates' },
  { label: 'Drug Lookup', url: '/drugs' },
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
                <p className="text-sm font-semibold text-[#0B1F3B]">
                  <a href="/editorial-policy" className="hover:text-primary-600 transition-colors">
                    Reviewed by licensed health insurance professionals
                  </a>
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-700">CMS Marketplace Certified</p>
                <p className="text-xs text-slate-500 mt-1">Recognized for enrollment excellence during the {operator.recognitionYear} Open Enrollment Period.</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Serving clients in {licensedStates.length} states: {licensedStates.map((s) => s.abbr).join(', ')}.
                </p>
              </div>
              <ul className="space-y-2 pt-2 border-t border-slate-100">
                <li><a href="/circle-of-champions" className="text-sm text-slate-600 hover:text-[#0B1F3B] transition-colors">Elite Circle of Champions Recognition</a></li>
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
              <p className="text-sm font-semibold text-[#0B1F3B]">
                <a href="/editorial-policy" className="hover:text-primary-600 transition-colors">
                  Reviewed by licensed health insurance professionals
                </a>
              </p>
              <p className="text-xs text-slate-500">CMS Marketplace Certified. Recognized for enrollment excellence during the {operator.recognitionYear} Open Enrollment Period.</p>
              <p className="text-xs text-slate-500">Serving clients in {licensedStates.length} states.</p>
              <a href="/circle-of-champions" className="block text-sm text-slate-600 hover:text-[#0B1F3B] transition-colors">Elite Circle of Champions Recognition</a>
              <a href="/data-methodology" className="block text-sm text-slate-600 hover:text-[#0B1F3B] transition-colors">Data &amp; Methodology</a>
            </div>
          </AccordionSection>
        </div>

        {/* Bottom disclaimer */}
        <div className="border-t border-slate-200 pt-8">
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-6">
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong className="text-slate-600">Important:</strong> HealthInsuranceRenew.com is not a government website and is not affiliated with Healthcare.gov or any government agency. This website is operated by licensed health insurance professionals and provides educational information about health insurance options. We may receive compensation from insurance carriers when you enroll through a licensed agent. Information on this site is for educational purposes only and does not constitute legal, tax, or benefits advice.
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
