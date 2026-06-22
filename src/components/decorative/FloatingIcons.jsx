import { Braces, Terminal } from 'lucide-react'

export function FloatingIcons() {
  return (
    <>
      <Braces
        className="pointer-events-none absolute left-[4%] top-[18%] size-28 text-white/[0.04] sm:left-[8%] sm:top-[22%] sm:size-36 lg:size-44"
        aria-hidden="true"
        strokeWidth={1}
      />
      <div
        className="pointer-events-none absolute bottom-[12%] right-[4%] flex size-20 items-center justify-center rounded-lg border border-white/[0.06] text-white/[0.05] sm:right-[8%] sm:size-24"
        aria-hidden="true"
      >
        <Terminal className="size-10 sm:size-12" strokeWidth={1} />
      </div>
    </>
  )
}
