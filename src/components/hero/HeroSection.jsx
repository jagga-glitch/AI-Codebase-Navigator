import { ReleaseBadge } from '@/components/hero/ReleaseBadge'
import { RepoAnalysisForm } from '@/components/hero/RepoAnalysisForm'
import { TrustBadges } from '@/components/hero/TrustBadges'
import { heroContent } from '@/lib/mock-data'

export function HeroSection() {
  return (
    <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center text-center">
        <ReleaseBadge />

        <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
          {heroContent.headline.primary}
          <br />
          <span className="text-primary">{heroContent.headline.accent}</span>
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg">
          {heroContent.description}
        </p>

        <div className="mt-10 w-full">
          <RepoAnalysisForm />
        </div>

        <TrustBadges className="mt-8" />
      </div>
    </section>
  )
}
