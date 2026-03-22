/** TimelineSteps — numbered step sequence (V19 .tl-item)
 *  No card wrapper — bare items with bottom borders.
 *  26px dark circle, 11.5px white number, ink title, mid desc, blue time tag. */

interface Step {
  title: string
  desc: string
  time: string
}

export default function TimelineSteps({ steps }: { steps: Step[] }) {
  return (
    <div>
      {steps.map((s, i) => (
        <div
          key={i}
          className="flex"
          style={{
            gap: '14px',
            padding: '13px 0',
            borderBottom: i < steps.length - 1 ? '1px solid #dbe3ec' : 'none',
          }}
        >
          <div
            className="rounded-full bg-ink text-white flex items-center justify-center shrink-0"
            style={{ width: 26, height: 26, fontSize: '11.5px', fontWeight: 500, marginTop: '2px' }}
          >
            {i + 1}
          </div>
          <div className="min-w-0">
            <div className="text-ink font-medium" style={{ fontSize: '13.5px' }}>
              {s.title}
            </div>
            <div className="text-mid" style={{ fontSize: '13px', marginTop: '2px', lineHeight: 1.55 }}>
              {s.desc}
            </div>
            <div className="text-vblue font-medium" style={{ fontSize: '11.5px', marginTop: '4px' }}>
              {s.time}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
