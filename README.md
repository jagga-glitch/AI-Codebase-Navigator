<<<<<<< HEAD
# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
=======
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
>>>>>>> origin/main
