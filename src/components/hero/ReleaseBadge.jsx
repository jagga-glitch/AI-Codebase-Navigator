import { Badge } from '@/components/ui/badge'
import { heroContent } from '@/lib/mock-data'

export function ReleaseBadge() {
  return (
    <Badge
      variant="outline"
      className="mb-8 gap-2 border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm font-normal text-slate-300"
    >
      <span className="size-2 rounded-full bg-emerald-400" aria-hidden="true" />
      {heroContent.releaseBadge}
    </Badge>
  )
}
