/** AeoBlock — AI Overview extraction target (V19 .aeo-block)
 *  White bg, 1px border, left 3px solid blue, rounded-right only.
 *  Caveat INSIDE the card below a rule line (not a separate element). */
export default function AeoBlock({
  label = 'Quick answer',
  answer,
  caveat,
}: {
  label?: string
  answer: string
  caveat: string
}) {
  return (
    <div
      className="bg-white border border-rule mt-[18px]"
      style={{ borderLeft: '3px solid #1a56a0', borderRadius: '0 8px 8px 0', padding: '15px 20px' }}
    >
      <span
        className="block text-vblue uppercase font-medium mb-1.5"
        style={{ fontSize: '10px', letterSpacing: '0.1em' }}
      >
        {label}
      </span>
      <div className="text-ink font-medium" style={{ fontSize: '14px', lineHeight: 1.5 }}>
        {answer}
      </div>
      {caveat && (
        <p
          className="text-muted border-t border-rule"
          style={{ fontSize: '11.5px', fontStyle: 'italic', marginTop: '10px', paddingTop: '9px' }}
        >
          {caveat}
        </p>
      )}
    </div>
  )
}
