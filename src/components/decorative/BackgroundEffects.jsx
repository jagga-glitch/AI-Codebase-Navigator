import { FloatingIcons } from '@/components/decorative/FloatingIcons'

export function BackgroundEffects() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-x-0 top-0 h-40 bg-[linear-gradient(rgba(127,29,29,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(127,29,29,0.12)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

      <div className="absolute left-1/2 top-[35%] h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.12)_0%,rgba(15,23,42,0.08)_45%,transparent_70%)] blur-3xl" />

      <FloatingIcons />
    </div>
  )
}
