import { navLinks } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function NavLinks({ className }) {
  return (
    <nav aria-label="Main navigation">
      <ul className={cn('flex items-center gap-8', className)}>
        {navLinks.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className={cn(
                'text-sm transition-colors',
                link.active
                  ? 'font-medium text-white underline decoration-white underline-offset-8'
                  : 'text-slate-500 hover:text-slate-300',
              )}
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
