/** ProcessBar — trust/credential strip below header (V19 .pbar — LIGHT variant)
 *  bg #f3f7fa (surface), text #728fa4, green dot. */
export default function ProcessBar({ items }: { items: string[] }) {
  return (
    <div
      role="complementary"
      aria-label="Page trust information"
      className="w-full flex items-center justify-center flex-wrap gap-x-[22px] gap-y-1 px-5 py-[5px]"
      style={{ background: '#f3f7fa', borderBottom: '1px solid #dbe3ec' }}
    >
      {items.map((item, i) => (
        <span
          key={i}
          className="flex items-center gap-1"
          style={{ fontSize: '11px', color: '#728fa4', letterSpacing: '0.01em' }}
        >
          <span
            className="w-1 h-1 rounded-full shrink-0"
            style={{ background: '#4ade80', opacity: 0.7 }}
            aria-hidden="true"
          />
          {item}
        </span>
      ))}
    </div>
  )
}
