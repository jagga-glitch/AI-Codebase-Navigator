# Navigator — AI CodeBase Navigator Landing Page

Pixel-faithful recreation of the Navigator hero landing page using React (Vite), Tailwind CSS, and shadcn/ui.

## Installation

```bash
cd "AI CodeBase Navigator"
npm install
npm install tailwindcss @tailwindcss/vite class-variance-authority clsx tailwind-merge lucide-react @radix-ui/react-slot tw-animate-css
```

## Development

```bash
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Component Hierarchy

```
App
├── BackgroundEffects
│   ├── Grid overlay (header area)
│   ├── Radial gradient glow
│   └── FloatingIcons
│       ├── Braces icon (top-left)
│       └── Terminal icon (bottom-right)
├── Header
│   ├── Logo ("Navigator")
│   ├── NavLinks
│   │   └── Explorer | Architecture | Insights
│   ├── SearchBar (shadcn Input + ⌘K shortcut)
│   └── Header actions
│       ├── Notification bell (shadcn Button ghost)
│       ├── Documentation link
│       └── Login button (shadcn Button)
└── HeroSection
    ├── ReleaseBadge (shadcn Badge)
    ├── Headline (white + primary accent)
    ├── Description
    ├── RepoAnalysisForm
    │   ├── URL Input (shadcn Input)
    │   └── Start Analysis button (shadcn Button)
    └── TrustBadges
        ├── Public & Private Repos
        ├── SOC2 Compliant
        └── < 60s Indexing
```

## Folder Structure

```
AI CodeBase Navigator/
├── components.json
├── jsconfig.json
├── index.html
├── package.json
├── vite.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── lib/
    │   ├── utils.js
    │   └── mock-data.js
    └── components/
        ├── decorative/
        │   ├── BackgroundEffects.jsx
        │   └── FloatingIcons.jsx
        ├── hero/
        │   ├── HeroSection.jsx
        │   ├── ReleaseBadge.jsx
        │   ├── RepoAnalysisForm.jsx
        │   └── TrustBadges.jsx
        ├── layout/
        │   ├── Header.jsx
        │   ├── NavLinks.jsx
        │   └── SearchBar.jsx
        └── ui/
            ├── badge.jsx
            ├── button.jsx
            └── input.jsx
```

## Tech Stack

- **React 19** + **Vite 8**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **shadcn/ui** (Button, Input, Badge)
- **lucide-react** icons
- **Mock data** in `src/lib/mock-data.js`
