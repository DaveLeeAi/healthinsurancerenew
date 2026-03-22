/** LimitsBlock — what this page can't confirm (V19 .limits-block, YMYL requirement) */

export default function LimitsBlock({
  title = 'What this page can\u2019t confirm',
  items,
}: {
  title?: string
  items: string[]
}) {
  return (
    <div className="bg-surface border border-rule rounded-[10px]" style={{ padding: '16px 20px' }}>
      <p
        className="text-mid uppercase font-medium"
        style={{ fontSize: '12px', letterSpacing: '0.07em', marginBottom: '10px' }}
      >
        {title}
      </p>
      <div className="flex flex-col" style={{ gap: '7px' }}>
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start text-mid"
            style={{ gap: '9px', fontSize: '13px', lineHeight: 1.5 }}
          >
            <span className="text-faint shrink-0" style={{ fontSize: '11px', marginTop: '2px' }} aria-hidden="true">
              &mdash;
            </span>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
