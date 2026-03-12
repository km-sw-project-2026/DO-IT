# AGENTS.md - Developer Guide for DO-IT

DO-IT is a community web application built with React 19 (SPA) on Cloudflare Workers/D1 with posts, comments, user management, document repository, and admin controls.

---

## Build/Lint/Test Commands

```bash
npm run dev              # Start Vite dev server (localhost:5173)
npm run build            # Build production bundle (outputs to dist/)
npm run preview          # Preview production build locally
npm run lint             # Run ESLint on entire project
npm run deploy           # Build and deploy to Cloudflare Workers
npm run schema:generate  # Export D1 database schema to database.sql
npm run schema:apply     # Apply schema from database.sql to D1
```

> **Note:** This project has **no test framework** configured. Do not write tests unless explicitly requested.

---

## Code Style Guidelines

### Language
- **JavaScript** with JSX (no TypeScript)
- ES Modules (`"type": "module"`)
- ECMAScript 2020+

### File Organization
```
src/
  api/           # Frontend API wrappers
  components/    # React components (PascalCase)
  css/           # Component-specific styles
  pages/         # Page-level components
  utils/         # Utility functions
functions/       # Cloudflare Pages Functions (backend API)
worker/          # Cloudflare Worker entry point
```

### Naming Conventions
- **Components**: PascalCase (e.g., `MypageRepository.jsx`)
- **Functions/variables**: camelCase (e.g., `apiGetFolders`)
- **CSS files**: Match component name (e.g., `MypageRepository.css`)

### Import Order
1. External imports (react, react-router-dom)
2. Local component imports
3. CSS imports
4. Relative utilities

```jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "./components/MainLayout.jsx";
import { apiGetFolders } from "../api/repository";
import "../css/MypageRepository.css";
```

### Component Structure
- Functional components with hooks
- Default export each component
- Use `useMemo` for expensive computations
- Use `useCallback` for callback props

### Error Handling
- **API calls**: Wrap in try/catch, use `console.warn` for failures, return safe defaults

```javascript
try {
  const res = await fetch(`/api/endpoint`, { headers: { "x-user-id": String(userId) } });
  if (!res.ok) throw new Error(await res.text());
  return await res.json();
} catch (e) {
  console.warn("apiGetFolders failed:", e);
  return [];  // Return safe default
}
```
- **User errors**: Use `alert()` for confirmations, or display in UI
- **Network errors**: Handle gracefully, never crash the app

### React Patterns
- `useState` for local state, `useEffect` for side effects
- `useMemo`/`useCallback` for optimization
- Prefer composition over prop drilling
- Use inline styles sparingly - prefer CSS files

### API Design (Frontend)
- Create wrappers in `src/api/`
- Naming: `apiGetX`, `apiCreateX`, `apiUpdateX`, `apiDeleteX`
- Accept user ID as first parameter

### Backend (Cloudflare Workers)
- Routes in `worker/index.js`
- Handlers in `functions/api/` directory
- Use D1 via `env.D1_DB`

```javascript
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}
```

### Database (D1/SQLite)
- Parameterized queries to prevent SQL injection
- Schema in `database.sql`

### Authentication
- User in `localStorage` or `sessionStorage` as JSON
- Use `getCurrentUser()` from `src/utils/auth.js`
- Admin check: `isAdmin()` or `me?.role === "ADMIN"`
- Pass user ID via `x-user-id` header

### ESLint
- Extends: ESLint recommended, react-hooks, react-refresh
- Custom rule: `no-unused-vars` allows vars starting with underscore or uppercase
- Run `npm run lint` before committing

---

## What NOT To Do

1. Do not add tests unless explicitly requested
2. Do not add TypeScript - plain JavaScript project
3. Do not change architecture (no Redux, no Next.js)
4. Do not commit secrets - never add `.env` to git
5. Do not use `alert()` excessively
6. Do not skip ESLint - fix lint errors before finishing

---

## Common Tasks

### Add new API endpoint
1. Create handler in `functions/api/<resource>/index.js`
2. Add route in `worker/index.js`
3. Create frontend wrapper in `src/api/`

### Add new page
1. Create component in `src/pages/` or `src/components/`
2. Add route in `src/App.jsx`

### Add new component
1. Create `src/components/ComponentName.jsx`
2. Create `src/css/ComponentName.css` (if needed)
3. Import in parent component

---

## Dependencies

**Core**: React 19, React DOM 19, React Router DOM 7, Vite 7  
**Dev/Cloudflare**: ESLint 9, eslint-plugin-react-hooks, @cloudflare/vite-plugin, Wrangler 4
