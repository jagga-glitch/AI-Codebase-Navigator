import { Link, Zap } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { heroContent } from '@/lib/mock-data'

export function RepoAnalysisForm() {
  return (
    <form
      className="mx-auto w-full max-w-3xl"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className="flex flex-col gap-3 rounded-xl border border-white/10 bg-[#0d0f17]/80 p-2 shadow-[0_0_0_1px_rgba(255,255,255,0.02)] backdrop-blur-sm sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
          <Link
            className="size-4 shrink-0 text-slate-500"
            aria-hidden="true"
          />
          <Input
            type="url"
            placeholder={heroContent.repoPlaceholder}
            className="h-11 border-0 bg-transparent px-0 font-mono text-sm text-slate-300 shadow-none placeholder:text-slate-600 focus-visible:ring-0"
            aria-label="Repository URL"
          />
        </div>
        <Button
          type="submit"
          size="lg"
          className="h-11 shrink-0 rounded-lg px-5 font-medium"
        >
          {heroContent.ctaLabel}
          <Zap className="size-4 fill-current" aria-hidden="true" />
        </Button>
      </div>
    </form>
  )
}
