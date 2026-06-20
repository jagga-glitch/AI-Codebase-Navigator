import { BackgroundEffects } from '@/components/decorative/BackgroundEffects'
import { HeroSection } from '@/components/hero/HeroSection'
import { Header } from '@/components/layout/Header'

function App() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-[#06070d]">
      <BackgroundEffects />
      <Header />
      <main className="relative flex flex-1 flex-col">
        <HeroSection />
      </main>
    </div>
  )
}

export default App
