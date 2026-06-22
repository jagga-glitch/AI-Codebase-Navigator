import { BadgeCheck, Gauge, Shield } from 'lucide-react'

import { trustBadges } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

const iconMap = {
  shield: Shield,
  'badge-check': BadgeCheck,
  gauge: Gauge,
}

export function TrustBadges({ className }) {
  return (
    <ul
      className={cn(
        'flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500',
        className,
      )}
    >
      {trustBadges.map((badge) => {
        const Icon = iconMap[badge.icon]

        return (
          <li key={badge.id} className="flex items-center gap-2">
            <Icon className="size-4 text-slate-500" aria-hidden="true" />
            <span>{badge.label}</span>
          </li>
        )
      })}
    </ul>
  )
}
