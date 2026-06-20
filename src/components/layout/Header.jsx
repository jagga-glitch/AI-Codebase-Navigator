import { Bell } from 'lucide-react'

import { NavLinks } from '@/components/layout/NavLinks'
import { SearchBar } from '@/components/layout/SearchBar'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="relative z-20 border-b border-white/[0.04]">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <a
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-white"
        >
          Navigator
        </a>

        <NavLinks className="ml-8 hidden lg:flex" />

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <SearchBar className="hidden md:block" />

          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white"
            aria-label="Notifications"
          >
            <Bell className="size-4" />
          </Button>

          <a
            href="#documentation"
            className="hidden text-sm text-slate-400 transition-colors hover:text-white sm:inline-block"
          >
            Documentation
          </a>

          <Button size="sm" className="rounded-lg px-4 font-medium">
            Login
          </Button>
        </div>
      </div>

      <div className="border-t border-white/[0.03] px-4 py-3 md:hidden">
        <SearchBar className="max-w-none" />
      </div>

      <div className="border-t border-white/[0.03] px-4 py-3 lg:hidden">
        <NavLinks className="justify-center" />
      </div>
    </header>
  )
}
