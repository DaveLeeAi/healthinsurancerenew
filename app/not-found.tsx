import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page Not Found | HealthInsuranceRenew',
  description: 'The page you are looking for could not be found.',
}

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <div className="text-6xl font-bold text-primary-600 mb-4">404</div>
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Page Not Found</h1>
      <p className="text-slate-600 leading-relaxed mb-8">
        The page you are looking for does not exist or may have been moved. Use the links below
        to find what you need.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Quick Links</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="text-primary-600 hover:text-primary-700 underline">Home</Link></li>
            <li><Link href="/eligibility-check" className="text-primary-600 hover:text-primary-700 underline">Do I Qualify for Health Insurance Savings?</Link></li>
            <li><Link href="/fpl-2026" className="text-primary-600 hover:text-primary-700 underline">2026 FPL Guidelines</Link></li>
            <li><Link href="/csr-explained-2026" className="text-primary-600 hover:text-primary-700 underline">Cost-Sharing Reductions</Link></li>
            <li><Link href="/aca-income-guide-2026" className="text-primary-600 hover:text-primary-700 underline">Health Insurance Savings by Income</Link></li>
          </ul>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold text-slate-800 mb-3">Tools & Guides</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/tools/income-savings-calculator" className="text-primary-600 hover:text-primary-700 underline">Estimate Your Savings</Link></li>
            <li><Link href="/tools/plan-comparison" className="text-primary-600 hover:text-primary-700 underline">Compare Plan Levels</Link></li>
            <li><Link href="/guides" className="text-primary-600 hover:text-primary-700 underline">All Guides</Link></li>
            <li><Link href="/states" className="text-primary-600 hover:text-primary-700 underline">Browse by State</Link></li>
            <li><Link href="/contact" className="text-primary-600 hover:text-primary-700 underline">Contact Us</Link></li>
          </ul>
        </div>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
      >
        ← Back to Home
      </Link>
    </div>
  )
}
