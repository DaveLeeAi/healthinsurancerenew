interface YmylDisclaimerProps {
  planYear: number
  includeAgentCta?: boolean
  includeSourceNote?: boolean
  sourceText?: string
}

export default function YmylDisclaimer({
  planYear,
  includeAgentCta = true,
  includeSourceNote = false,
  sourceText,
}: YmylDisclaimerProps) {
  return (
    <footer className="border-t border-neutral-200 pt-6 text-xs text-neutral-400 space-y-2">
      <p>
        This page is for informational purposes only and does not constitute health insurance,
        medical, legal, or tax advice. Coverage details, premiums, and subsidy amounts may vary
        based on your specific situation.
      </p>
      {includeAgentCta && (
        <p>
          <strong className="text-neutral-500">Always consult a licensed health insurance agent</strong>{' '}
          before making enrollment or coverage decisions. Your agent can verify plan availability,
          confirm subsidy eligibility, and help you choose the best coverage for your household.
        </p>
      )}
      {includeSourceNote && sourceText && (
        <p>Source: {sourceText}, Plan Year {planYear}.</p>
      )}
      {!includeSourceNote && (
        <p>
          Data sourced from{' '}
          <a
            href="https://www.cms.gov/marketplace/resources/data/public-use-files"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-500 hover:underline"
          >
            CMS Public Use Files
          </a>{' '}
          for Plan Year {planYear}.
        </p>
      )}
    </footer>
  )
}
