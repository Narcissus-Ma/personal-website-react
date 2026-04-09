# Home Page Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin-managed background image options that only apply to the home page in light mode, including translucent header and sidebar treatment.

**Architecture:** Keep background option data in `site-store` alongside other site content and persist the selected home-page background locally in `theme-store`. Apply the visual effect through a home-page-only data attribute plus CSS variables so the existing layout can become transparent only on the home page in light mode.

**Tech Stack:** React 18, TypeScript, Zustand, Ant Design, LESS, Vite, Cloudflare Worker KV

---

### Task 1: Data Model And Persistence

**Files:**
- Modify: `src/types/data.ts`
- Modify: `src/types/index.ts`
- Create: `src/types/background.ts`
- Modify: `src/stores/site-store.ts`
- Modify: `cloudflare/worker.mjs`
- Modify: `src/data/data.json`

- [ ] Add `BackgroundImage` type with `url: string | null`
- [ ] Extend `SiteData` and `site-store` to load/save `backgrounds`
- [ ] Add CRUD methods for backgrounds into `site-store`
- [ ] Make Worker `/api/data` return a default `backgrounds` array when KV is empty
- [ ] Seed `src/data/data.json` with a default background entry

### Task 2: Local Preference And Home-Page Activation

**Files:**
- Modify: `src/stores/theme-store.ts`
- Modify: `src/stores/index.ts`
- Modify: `src/hooks/use-theme.ts`

- [ ] Persist `selectedHomeBackground` in localStorage
- [ ] Add helpers to sync the current route/theme/background choice onto document dataset and CSS variables
- [ ] Ensure the effect is enabled only for the home page in light mode
- [ ] Add fallback behavior when the saved background no longer exists in the server-provided list

### Task 3: Home Page UI

**Files:**
- Modify: `src/pages/home-page/index.tsx`
- Modify: `src/pages/home-page/home-page.module.less`

- [ ] Show background selector next to language selector only in light mode on the home page
- [ ] Connect selector options to `site-store.backgrounds`
- [ ] Sync home-page activation on mount/unmount and on route/theme/background changes
- [ ] Add a home-page background layer and readable overlay

### Task 4: Manage Page CRUD

**Files:**
- Modify: `src/pages/manage-page/index.tsx`
- Modify: `src/pages/manage-page/manage-page.module.less` (only if needed)

- [ ] Add a background-management tab
- [ ] Reuse `site-store` methods for add/edit/delete/save
- [ ] Prevent deleting the default background entry
- [ ] Keep the UI usable on both desktop and mobile layouts

### Task 5: Layout Transparency

**Files:**
- Modify: `src/assets/styles/global.less`
- Modify: `src/components/layout/layout.module.less`

- [ ] Introduce CSS variables for home-page background image and overlay
- [ ] Make header, sider, and content transparent or translucent only when home-page background mode is active
- [ ] Preserve current appearance on non-home routes and in dark mode

### Task 6: Verification

**Files:**
- No code changes required unless fixes are needed

- [ ] Run `npm run lint`
- [ ] Run `npm run build`
- [ ] Manually verify home page light/dark switching, route isolation, and background fallback behavior
