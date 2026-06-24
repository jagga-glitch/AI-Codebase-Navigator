import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext.jsx';

export default function LandingPage() {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const [repoUrl, setRepoUrl] = useState('');

  const handleStartExploring = (e) => {
    e.preventDefault();
    if (isAuthenticated) {
      navigate('/dashboard', { state: { initialUrl: repoUrl } });
    } else {
      navigate('/login', { state: { redirectUrl: '/dashboard', initialUrl: repoUrl } });
    }
  };

  return (
    <div className="bg-background text-on-surface font-body-md min-h-screen flex flex-col selection:bg-primary selection:text-on-primary">
      {/* TopNavBar Component */}
      <nav className="fixed top-0 left-0 right-0 h-16 bg-surface z-50 flex items-center justify-between px-container-padding border-b border-outline-variant">
        <div className="flex items-center gap-stack-lg">
          <span className="font-headline-md text-headline-md font-black text-on-surface tracking-tighter">Navigator</span>
          <div className="hidden md:flex items-center gap-gutter">
            <Link className="text-primary font-bold border-b-2 border-primary pb-1 font-body-lg text-body-lg" to="/">Explorer</Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-lg text-body-lg" to="/docs">API Reference</Link>
            <Link className="text-on-surface-variant hover:text-primary transition-colors font-body-lg text-body-lg" to="/interview">Interview Prep</Link>
          </div>
        </div>
        <div className="flex items-center gap-gutter">
          <div className="flex items-center gap-stack-md">
            {isAuthenticated ? (
              <Link to="/dashboard" className="bg-primary text-on-primary font-body-md text-body-md font-bold px-stack-md py-2 rounded-lg hover:bg-primary-fixed transition-colors">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-on-surface-variant hover:text-primary font-body-md text-body-md transition-colors px-3 py-2">
                  Login
                </Link>
                <Link to="/register" className="bg-primary text-on-primary font-body-md text-body-md font-bold px-stack-md py-2 rounded-lg hover:bg-primary-fixed transition-colors">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-16 flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[800px] flex flex-col items-center justify-center px-container-padding overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 hero-mesh opacity-30 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
          
          {/* Floating Decorative Icons */}
          <div className="absolute top-20 left-[15%] opacity-20 animate-pulse">
            <span className="material-symbols-outlined text-6xl text-primary">data_object</span>
          </div>
          <div className="absolute bottom-40 right-[12%] opacity-20 animate-pulse" style={{ animationDelay: '1s' }}>
            <span className="material-symbols-outlined text-6xl text-secondary">terminal</span>
          </div>

          <div className="relative z-10 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 mb-stack-lg border border-primary/30 rounded-full bg-primary/5">
              <span className="flex h-2 w-2 rounded-full bg-secondary animate-ping"></span>
              <span className="font-label-caps text-label-caps text-primary">New: v1.2 Release with Deep Dependency Mapping</span>
            </div>
            <h1 className="font-headline-lg text-[64px] leading-[1.1] mb-stack-md tracking-tight">
              Master Any Codebase <br />
              <span className="text-primary">in Minutes, Not Months.</span>
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant mb-stack-lg max-w-2xl mx-auto">
              AI CodeBase Navigator indexes your entire repository, maps architectures, and answers complex technical questions instantly. Stop reading docs, start shipping.
            </p>

            {/* URL Input Field */}
            <form onSubmit={handleStartExploring} className="max-w-xl mx-auto mb-stack-lg group">
              <div className="flex bg-surface-container border border-outline-variant p-2 rounded-xl focus-within:border-primary transition-all duration-300">
                <div className="flex items-center pl-3 pr-2">
                  <span className="material-symbols-outlined text-outline">link</span>
                </div>
                <input 
                  type="text" 
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="Paste GitHub Repository URL (e.g., https://github.com/facebook/react)"
                  className="bg-transparent border-none focus:ring-0 text-body-md font-code-md text-on-surface placeholder:text-outline w-full px-2"
                />
                <button type="submit" className="bg-primary text-on-primary font-bold px-6 py-2.5 rounded-lg hover:bg-primary-fixed transition-colors flex items-center gap-2 whitespace-nowrap active:scale-95 duration-150">
                  <span>Start Exploring</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Feature Spotlight (Bento Layout) */}
        <section className="py-stack-lg px-container-padding max-w-7xl mx-auto border-t border-outline-variant/30">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
            <div className="md:col-span-8 bento-card rounded-2xl overflow-hidden relative group p-stack-lg bg-surface-container-low min-h-[300px] flex flex-col justify-between">
              <div>
                <span className="font-label-caps text-label-caps text-primary mb-2 block">POWERFUL VISUALIZATION</span>
                <h3 className="font-headline-lg text-headline-lg text-on-surface mb-stack-md">Map Architectural Flow</h3>
                <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
                  Automatically generate dynamic sequence diagrams and dependency graphs. Understand how data flows from your API controllers to the database in real-time.
                </p>
              </div>
            </div>
            <div className="md:col-span-4 bento-card rounded-2xl p-stack-lg flex flex-col justify-between bg-surface-container-low border border-outline-variant">
              <div>
                <span className="font-label-caps text-label-caps text-secondary mb-2 block">CONTEXT AWARE</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Integrated AI Chat</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-stack-md">
                  Chat directly with your code. Navigator understands file hierarchies, imports, and cross-file references.
                </p>
              </div>
              <div className="mt-stack-lg bg-surface-container-highest p-4 rounded-xl border border-outline-variant font-code-sm text-code-sm">
                <div className="flex items-center gap-2 mb-2 text-secondary">
                  <span className="material-symbols-outlined text-sm">smart_toy</span>
                  <span className="">AI Assistant</span>
                </div>
                <p className="text-on-surface-variant">The 'UserStore' class handles database connections in <span className="text-primary">lib/stores.ts</span>. You can find the caching logic on line 42.</p>
              </div>
            </div>
            
            <div className="md:col-span-4 bento-card rounded-2xl p-stack-lg relative overflow-hidden group bg-surface-container-low border border-outline-variant min-h-[220px]">
              <span className="font-label-caps text-label-caps text-tertiary mb-2 block">INSIGHTS</span>
              <h3 className="font-headline-md text-headline-md text-on-surface">Security Audit</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-stack-md">
                Identify credential leaks, circular dependencies, and outdated packages instantly.
              </p>
              <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="material-symbols-outlined text-[120px]">verified_user</span>
              </div>
            </div>
            <div className="md:col-span-8 bento-card rounded-2xl p-stack-lg flex flex-col md:flex-row items-center gap-stack-lg bg-surface-container-low border border-outline-variant">
              <div className="flex-grow">
                <span className="font-label-caps text-label-caps text-on-surface-variant mb-2 block">TEAM SYNC</span>
                <h3 className="font-headline-md text-headline-md text-on-surface">Shared Knowledge Base</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mt-stack-md">
                  Annotate repositories and share complex architectural insights with your whole team. Onboard new developers 10x faster.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer class="bg-surface-container-lowest border-t border-outline-variant py-stack-lg">
        <div class="max-w-7xl mx-auto px-container-padding">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-stack-lg">
            <div class="col-span-2">
              <span class="font-headline-md text-headline-md font-black text-on-surface tracking-tighter mb-4 block">Navigator</span>
              <p class="text-on-surface-variant font-body-md text-body-md max-w-sm mb-stack-lg">The world's most advanced AI-powered codebase exploration tool. Designed by engineers, for engineers.</p>
            </div>
            <div>
              <h5 class="font-label-caps text-label-caps text-on-surface mb-stack-md">PRODUCT</h5>
              <ul class="space-y-2 text-on-surface-variant font-body-md text-body-md">
                <li><a class="hover:text-primary transition-colors" href="#">Features</a></li>
                <li><a class="hover:text-primary transition-colors" href="#">Enterprise</a></li>
              </ul>
            </div>
            <div>
              <h5 class="font-label-caps text-label-caps text-on-surface mb-stack-md">RESOURCES</h5>
              <ul class="space-y-2 text-on-surface-variant font-body-md text-body-md">
                <li><Link class="hover:text-primary transition-colors" to="/docs">Documentation</Link></li>
                <li><Link class="hover:text-primary transition-colors" to="/interview">Interview Prep</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
