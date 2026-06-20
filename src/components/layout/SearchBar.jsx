import { Search } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function SearchBar({ className }) {
  return (
    <div className={cn('relative w-full max-w-xs', className)}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
        aria-hidden="true"
      />
      <Input
        type="search"
        placeholder="Search documentation..."
        className="h-9 border-white/10 bg-[#0d0f17] pl-9 pr-14 text-sm text-slate-300 placeholder:text-slate-600"
        aria-label="Search documentation"
      />
      <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 sm:inline-block">
        ⌘K
      </kbd>
    </div>
  )
}
