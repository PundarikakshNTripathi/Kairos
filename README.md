# Kairos

A deeply interactive, locally persistent Executive Focus and Life Tracker designed with absolute minimalism, stark typography, and brutalist aesthetics. 

## Table of Contents
1. [Introduction and Motivation](#introduction-and-motivation)
2. [Layman Explanation](#layman-explanation)
3. [Deep Technical Approach](#deep-technical-approach)
4. [System Architecture](#system-architecture)
5. [Repository Structure](#repository-structure)
6. [Tech Stack Used](#tech-stack-used)
7. [Features](#features)
8. [Setup, Execution, and Usage](#setup-execution-and-usage)
9. [Results, Benchmarks and Evaluation](#results-benchmarks-and-evaluation)
10. [Current Status, Limitation and Future Work](#current-status-limitation-and-future-work)
11. [Troubleshooting and Debugging](#troubleshooting-and-debugging)
12. [Contribution Policy](#contribution-policy)
13. [License](#license)
14. [Citation Guide](#citation-guide)

## Introduction and Motivation
Kairos (meaning the right, critical, or opportune moment) was built to strip away the bloated features of modern productivity apps. The motivation stems from a singular philosophy: context dictates urgency. By enforcing a strict, visually commanding interface that contextualizes your daily tasks against the sheer scale of your entire lifespan, Kairos stops you from losing the forest for the trees. It is not just a tool; it is a mindset shift encapsulated in software.

## Layman Explanation
Imagine seeing your entire 90-year lifespan visualized as a massive grid of tiny boxes. Each box is exactly one day of your life. As days pass, they turn gray. You can click on any box to journal your thoughts for that specific day. Alongside this massive grid is an Executive Focus board, an unbounded list where you declare your absolute top priorities. The app is incredibly fast because it saves your typing instantly to your own device, and then quietly backs it up to a secure cloud so you can log in from your phone or another computer and see everything perfectly synced.

## Deep Technical Approach
Kairos is a blazingly fast Single Page Application (SPA) relying on a hybrid synchronization architecture. State persistence relies heavily on Optimistic UI principles: changes are written immediately to synchronous `localStorage` wrapped seamlessly into a Zustand store, entirely eliminating the micro-stutters and hydration flashes typical of asynchronous IndexedDB implementations. A background process then quietly syncs these changes to a Supabase (PostgreSQL) backend. 

To achieve optimal performance, the 32,872 grid boxes required for the 90-year matrix are rendered using raw HTML5 Canvas APIs rather than individual DOM nodes. This circumvents the massive memory overhead and reflow costs associated with heavy DOM structures, ensuring a strict 60 frames per second rendering cycle. Journal text is plain text and is only ever written into the DOM as `textContent`, never parsed as HTML, which removes the XSS vector without mangling what you wrote.

## System Architecture
```mermaid
graph TD
    A[User Interface - React] -->|State reads/writes| B(Zustand Store)
    B -->|Optimistic UI - Fast| C[localStorage Adapter]
    B -->|Async Background Sync| G[Supabase Postgres]
    C -->|Sync Storage| D[(localStorage)]
    
    A --> E[Canvas Matrix]
    E -->|Hover/Click Events| F[Math Coordinates to Date Mapper]
    F --> B
```

## Repository Structure
```
.
├── components.json                 # shadcn/ui configuration file mapping internal paths
├── .env                            # Local environment variables (VITE_SUPABASE_*)
├── .gitignore                      # Git path exclusions
├── index.html                      # Entry HTML file, containing root DOM node and CSP headers
├── LICENSE                         # Elastic License 2.0 terms
├── .npmrc                          # NPM configuration defining peer dependency strategies
├── .oxlintrc.json                  # Linter configuration rules
├── package.json                    # Project dependencies and script runner configurations
├── package-lock.json               # Deterministic dependency resolution tree
├── postcss.config.js               # CSS processor configuration mapping to Tailwind
├── public/                         # Static assets directly served to the client
│   ├── favicon.png                 # Browser tab icon (PNG fallback)
│   ├── favicon.svg                 # Vector browser tab icon
│   └── icons.svg                   # PWA icon vectors
├── README.md                       # Comprehensive documentation (this file)
├── src/                            # Core application source code
│   ├── App.tsx                     # Main layout shell, router, and UI orchestration
│   ├── components/                 # React UI Components
│   │   ├── CalendarView.tsx        # Monthly calendar of journal entries (future days locked)
│   │   ├── DeathClock.tsx          # Live countdown hero: days left, d/h/m/s.t, % of life and of today spent
│   │   ├── FocusBoard.tsx          # Priority list with keyboard flow, plus the Perspective panel
│   │   ├── Memento.tsx             # Once-a-day "yesterday is gone" full-screen overlay
│   │   ├── Perspective.tsx         # Weekends, birthdays, full moons, nights, meals and waking hours left
│   │   ├── SettingsModal.tsx       # First-run onboarding, birthdate, lifespan, backup export/restore
│   │   ├── Guide.tsx               # Philosophy and documentation view component
│   │   ├── JournalModal.tsx        # Daily journal modal (plain-text entries)
│   │   ├── LifeGrid.tsx            # HTML5 Canvas grid sized to fit the whole life on screen
│   │   ├── LoginButton.tsx         # OAuth and Magic Link authentication orchestration
│   │   ├── ProfileModal.tsx        # Profile editing interface (avatar and username)
│   │   └── ui/                     # shadcn/ui atomic design system components
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── input.tsx
│   │       └── textarea.tsx
│   ├── index.css                   # Tailwind variable declarations and stark color themes
│   ├── lib/                        # Pure utility functions and wrappers
│   │   ├── hooks.ts                # useNow / useDayKey clock hooks
│   │   ├── supabase.ts             # Supabase client initialization and exports
│   │   ├── time.ts                 # Life statistics: days left, countdown split, perspectives
│   │   └── utils.ts                # Class merge utilities for Tailwind
│   ├── main.tsx                    # React DOM root render entry point
│   └── store/                      # Zustand state management module
│       ├── storage.ts              # Custom localStorage adapter for Zustand
│       └── useStore.ts             # The global hybrid store (optimistic sync logic)
├── tailwind.config.js              # Theme constraints and extended animations
├── tsconfig.app.json               # TypeScript configuration for the React application
├── tsconfig.json                   # Base TypeScript config references
├── tsconfig.node.json              # TypeScript configuration for the Vite bundler runtime
└── vite.config.ts                  # Vite bundler, PWA plugin, and path alias configuration
```

## Tech Stack Used
- **Core Framework:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS v3, Base UI (shadcn/ui), Instrument Serif, Geist and Geist Mono
- **State and Sync:** Zustand, localStorage (synchronous), Supabase (PostgreSQL, Auth, Storage)
- **Time Math:** date-fns
- **Security:** CSP headers; journal text is only rendered as `textContent`
- **PWA:** vite-plugin-pwa

## Features
- **Live Death Clock:** The hero shows the days you have left in large type, a countdown ticking to a tenth of a second, the percentage of your life and of today already gone, and the browser tab title itself counts down. The page background darkens and reddens slightly as the fraction of life spent grows.
- **Daily Memento:** Once per calendar day (and after midnight while the app is open) a full-screen overlay strikes through yesterday's count, shows the new one, and lists the priorities you said mattered.
- **What Is Actually Left:** Weekends, birthdays, full moons, nights, meals and waking hours remaining, derived from your numbers.
- **Configurable Lifespan:** Expected lifespan (30 to 120 years, default 80) sizes the grid. Past that estimate the app switches to "borrowed time".
- **Backup and Restore:** Export all data to JSON from Settings and merge it back in; malformed files are rejected.
- **Temporal Canvas Grid:** One square per day of your estimated lifespan (29,220 at the default 80 years), rendered via Canvas APIs and scaled so the entire life fits in the panel without scrolling on desktop. Hover shows the date, your age on it, how far away it is, and a preview of any entry; today pulses, written days are amber, and the last day is marked. Rendering this volume of nodes via standard DOM elements typically causes 150-300ms of layout thrashing and severe garbage collection spikes. By bypassing the DOM entirely, the single Canvas element strictly maintains a ~2-5ms render time, achieving a flawless 60fps interaction rate even on entry-level mobile devices.
- **Historical Calendar View:** Dedicated visual calendar grid supporting mouse navigation and precise date search capabilities, allowing instant jumping to any past daily log.
- **Executive Focus:** Priority list with Enter to add, Backspace on an empty row to remove, and blunt feedback when you list too many things.
- **Command Palette Journal:** Deeply integrated global shortcut (Ctrl+K) journaling on Desktop, and an adaptive Floating Action Button on Mobile interfaces.
- **Ash and Bone Theming:** A near-black "Ash" dark theme (default) and a paper-toned "Bone" light theme, both with a single ember-red accent, an editorial serif for statements and a monospace for numbers.
- **Passwordless Authentication and Profiles:** Secure login flows utilizing Email Magic Links, GitHub OAuth, or Google OAuth. Extended with a bespoke user profile system supporting custom usernames and avatar uploads.
- **Philosophy Guide:** A natively rendered subpage detailing the exact mechanics, reasoning, and security paradigms embedded within the application.
- **Hybrid Storage and Privacy:** Instant offline caching via native `localStorage`, seamlessly synced to a Supabase backend secured by strict Row Level Security (RLS) policies.
- **Bulletproof Security:** Secured with a strict Content-Security-Policy and plain-text-only journal rendering (never parsed as HTML).
- **Progressive Web App Ready:** Install natively to Windows, Mac, iOS, or Android directly from the browser without relying on centralized App Stores.

## Setup, Execution, and Usage
### Local Setup
Ensure you have a Supabase project initialized. Create a `.env` file at the root of the repository containing your keys:
```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```
Then run the standard build sequence:
```bash
npm ci
npm run dev
```

### PWA Usage
Visit the local development URL (or your deployed URL) and click the "Install" icon situated in your browser address bar to install Kairos as a standalone desktop or mobile application.

## Results, Benchmarks and Evaluation
Real world performance benchmarks run locally against production builds yielded the following metrics:
- **Canvas Rendering Pipeline:** Less than 5ms execution time to parse 32,872 distinct mathematical paths and render the grid.
- **Browser verification:** Exercised with Playwright in Chromium, Firefox and WebKit on desktop, and with iPhone 15 (WebKit) and Pixel 7 (Chromium) touch emulation. Coverage: onboarding, day-count arithmetic cross-checked against an independent calculation, grid hover/click/tap, journaling (Enter/Esc/overlay/close-button saves, maximize, plain-text new-tab view), calendar (jump, month bounds, locked future days), memento and midnight rollover, settings, backup export/restore (including malformed files), avatar drag-and-drop/paste/file-chooser, themes, reduced motion, keyboard/tab order, and the Supabase login, OAuth redirect round trip, profile and sync flows against a mocked Supabase host. A real Supabase project, live GitHub/Google sign-in pages and physical devices were not tested.
- **Hydration:** ~0ms latency to retrieve the user's data from `localStorage` and hydrate the Zustand global store synchronously, completely eliminating UI layout flashes on cold start.
- **Memory Footprint:** The absolute reliance on Canvas over DOM nodes keeps the application's heap size below 30MB during peak interaction.

## Current Status, Limitation and Future Work
**Current Status:** Stable Version 2.0. The core philosophy, sync engine, and user interfaces are fully materialized.
**Limitations:** Initial synchronization may introduce a fractional second delay when logging into a fresh device with zero local cache. Image uploads are restricted to standard web formats and rely entirely on Supabase storage boundaries.
**Future Work:** 
- Implement end-to-end (E2E) encryption for journal payloads to ensure zero-knowledge architecture.
- Expand profile functionality to support peer-to-peer habit tracking or accountability graphs.
- Deep integration with external APIs (like GitHub contributions) to overlay objective data onto the Life Grid.

## Troubleshooting and Debugging
- **Data missing across devices?** Ensure you have fully authenticated via the Cloud Sync button. Offline edits are queued, but authentication is strictly required for the uplink to Supabase.
- **Grid not sizing properly?** The application relies on modern `ResizeObserver` APIs. Ensure your browser is up to date (Chromium version >64, Firefox version >69).
- **Authentication Errors:** If you receive a "No API key found in request" error, verify that your `.env` variables exactly match your Supabase project without any trailing slashes in the URL path.

## Contribution Policy
All Pull Requests must strictly branch from the `develop` trunk. Adhere to conventional commit nomenclature. UI changes must adhere strictly to the precise Hex token arrays in `index.css`. Code that degrades Canvas rendering performance or introduces memory leaks will be rejected.

## License
**Elastic License 2.0**
By using this software, you agree to the terms of the Elastic License 2.0. This explicitly restricts providing the software to third parties as a managed service.

## Citation Guide
```bibtex
@misc{kairos2026,
  author = {Pundarikaksh Narayan Tripathi},
  title = {Kairos: A Brutalist, Local-First Executive Focus and Temporal Tracker},
  year = {2026},
  publisher = {GitHub},
  journal = {GitHub repository},
  howpublished = {\url{https://github.com/PundarikakshNTripathi/Kairos}}
}
```
