# AGENTS.md - Development Guidelines for Personal Website

## Project Overview

This is a personal website built with React 18, TypeScript, Vite, Zustand, React Router, and Ant Design. It features a multilingual personal homepage with category-based website links, a management page for editing content, and an about page.

## Build Commands

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm run preview # Preview production build locally
npm run lint     # Run ESLint on src directory
```

**Running a Single Test:** This project does not currently have test scripts configured.

## Code Style Guidelines

### General Principles

- Use TypeScript for all new code with strict type checking
- Prefer functional components with hooks over class components
- Keep components small and focused on a single responsibility
- Use ESLint warnings as guidance; fix lint errors before committing

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `HomePage.tsx`, `WebItem.tsx` |
| Hooks | camelCase with `use` prefix | `useLanguage.ts`, `useCategories.ts` |
| Stores | camelCase | `site-store.ts` |
| Types | PascalCase | `Category.ts`, `Website.ts` |
| CSS Modules | kebab-case same as component | `home-page.module.less` |
| Index files | `index.ts` or `index.tsx` | `src/components/layout/index.ts` |

### Import Order

1. React imports (for types like `React.FC`, `React.ReactNode`)
2. Third-party library imports (Ant Design, React Router, Zustand)
3. Internal absolute imports (`@/` alias for `src/`)
4. Relative imports (local components, hooks, types)
5. Type-only imports use `import type`

```typescript
import React, { useState, useCallback } from 'react';
import { Button, Select, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { create } from 'zustand';
import AppLayout from '@/components/Layout';
import { useLanguage, useCategories } from '@/hooks';
import { Category, Website } from '@/types';
import styles from './home-page.module.less';
```

### TypeScript Guidelines

- Enable strict mode in tsconfig.json for new code
- Use explicit types for function parameters and return types
- Use `interface` for public API types, `type` for unions/intersections
- Use `import type` when importing types only
- Prefer `React.FC<Props>` for functional component type annotation

```typescript
interface WebItemProps {
  item: Category | Website;
  transName: (item: Category) => string;
}

const WebItem: React.FC<WebItemProps> = ({ item, transName }) => {
  // component implementation
};
```

### React & Hooks Best Practices

- Use `useCallback` for functions passed as props to prevent unnecessary re-renders
- Use `useMemo` for expensive computations
- Name custom hooks with `use` prefix (e.g., `useLanguage`, `useCategories`)
- Prefer early returns over nested conditionals
- Destructure props for readability

```typescript
export const useLanguage = () => {
  const [language, setLanguage] = useState<Language>('zh');

  const transName = useCallback(
    (item: { name: string; en_name: string }): string => {
      return language === 'zh' ? item.name : item.en_name;
    },
    [language]
  );

  return { language, setLanguage, transName, languageOptions };
};
```

### Component Structure

Follow this order within component files:

1. Imports (external, internal, types, styles)
2. Type definitions (interfaces/types)
3. Component function with explicit return type
4. JSX return
5. Default export

```typescript
import React from 'react';
import { Button } from 'antd';
import styles from './component.module.less';

interface ComponentProps {
  title: string;
  onClick: () => void;
}

const MyComponent: React.FC<ComponentProps> = ({ title, onClick }) => {
  return (
    <div className={styles.container}>
      <Button onClick={onClick}>{title}</Button>
    </div>
  );
};

export default MyComponent;
```

### State Management (Zustand)

- Define store interfaces extending the data types they manage
- Use immutable update patterns (spread operators, array methods)
- Place API constants at the top of the store file

```typescript
import { create } from 'zustand';
import { SiteData, Category, SearchEngine, Website } from '../types';

interface SiteStore extends SiteData {
  setCategories: (categories: Category[]) => void;
  addCategory: (category: Category) => void;
}

const API_BASE = 'http://localhost:3000/api';

export const useSiteStore = create<SiteStore>((set, get) => ({
  categories: [],
  setCategories: (categories) => set({ categories }),
  addCategory: (category) =>
    set((state) => ({ categories: [...state.categories, category] })),
}));
```

### Styling Guidelines

- Use CSS Modules (`.module.less`) for component-scoped styles
- Use LESS variables from `@/assets/styles/variables.less`
- Follow BEM-like naming within CSS modules: `.componentName_elementName`
- Use Ant Design's built-in theming via LESS variables in `vite.config.ts`

```typescript
// Component
import styles from './home-page.module.less';

return (
  <div className={styles.home}>
    <div className={styles.toolbar}>...</div>
  </div>
);
```

### Error Handling

- Use try/catch for async operations with user-friendly error messages
- Throw descriptive errors for unexpected states
- Handle API errors gracefully with user feedback

```typescript
saveToServer: async () => {
  const { categories, searchEngines } = get();
  const response = await fetch(`${API_BASE}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categories, searchEngines }),
  });
  if (!response.ok) {
    throw new Error('Failed to save data');
  }
},
```

### Routing

- Use `react-router-dom` for routing
- Define routes in `src/router/index.tsx` using `createBrowserRouter`
- Use `<Link>` component for internal navigation

### Ant Design Usage

- Use Ant Design components for UI (Button, Select, Card, Layout, etc.)
- Use `@ant-design/icons` for icons
- Customize theme via LESS variables in `vite.config.ts`

### Project Directory Structure

```
src/
├── assets/
│   └── styles/           # Global LESS styles and variables
├── components/           # Reusable UI components
│   ├── layout/          # AppLayout component
│   ├── web-item/        # Website card component
│   ├── search-box/      # Search input component
│   ├── footer/          # Footer component
│   └── index.ts         # Barrel export
├── data/                # Static JSON data
├── hooks/               # Custom React hooks
│   ├── use-language.ts  # Language switching hook
│   └── use-categories.ts
├── pages/               # Page components
│   ├── home-page/
│   ├── manage-page/
│   └── about-page/
├── stores/               # Zustand stores
│   └── site-store.ts
├── types/                # TypeScript type definitions
│   ├── category.ts
│   ├── data.ts
│   └── search-engine.ts
├── router/               # React Router configuration
│   └── index.tsx
├── App.tsx               # Root component
└── main.tsx              # Entry point
```

### Path Aliases

The `@` alias is configured to point to `src/`. Use it for internal imports:

```typescript
import AppLayout from '@/components/Layout';
import { useLanguage } from '@/hooks';
```

### Working with JSON Data

- Static data lives in `src/data/data.json`
- Types for data structures are defined in `src/types/`
- Use TypeScript interfaces to ensure type safety when working with data

### Running Lint

Always run `npm run lint` before committing to ensure code quality:

```bash
npm run lint
```

Fix any ESLint errors reported. Warnings are acceptable but should be minimized.

### Development Workflow

1. Create a new branch for features/fixes
2. Make changes following the guidelines above
3. Run `npm run lint` to check code quality
4. Test locally with `npm run dev`
5. Build with `npm run build` to verify production build works
