# Playbook: Add i18n and Move Copy to Translation JSON Files

---

## When to Use This

When the app has hardcoded user-facing text (labels, headings, button copy, placeholders) embedded directly in components or route files, and you want to:
- Centralise all copy in JSON translation files so it can be edited without touching code
- Prepare the app for English and Chinese language support
- Make future language switching possible without a full refactor

---

## Prerequisites

- [ ] You are on a dedicated git branch (not main)
- [ ] The app runs locally before you start (`pnpm --filter more-health-remix dev`)
- [ ] You know which files contain hardcoded text (see Step 1 below)
- [ ] Node / pnpm available

---

## Library Stack

| Package | Role |
|---|---|
| `i18next` | Core translation engine |
| `react-i18next` | Provides `useTranslation()` hook in React components |
| `remix-i18next` | Bridges i18next with the Remix / React Router v7 loader lifecycle — handles SSR |
| `i18next-fs-backend` | Server-side: reads locale JSON files from the filesystem |
| `i18next-http-backend` | Client-side: fetches locale JSON over HTTP from `/public/locales/` |
| `i18next-browser-languagedetector` | Detects user language from browser / HTML `lang` attribute |

**Why this stack and not something else:** `remix-i18next` is the documented, maintained standard for Remix and React Router v7. It handles the SSR handoff correctly — the server detects the locale, serialises it through the loader, and the client picks it up from the `lang` attribute on `<html>` without a flash. `react-i18next` is the industry-standard React binding for i18next, with wide documentation.

---

## File Structure After This Playbook

```
app/
  i18n.ts                  # shared config (supported languages, namespaces, fallback)
  i18next.server.ts        # server-side RemixI18Next instance

public/
  locales/
    en/
      common.json          # nav, sidebar, header, page headings — loaded on every page
      dashboard.json       # dashboard-specific copy — loaded only on /
    zh/
      common.json
      dashboard.json
```

New pages get their own namespace file (e.g. `orders.json`) when they have real content.

---

## Step-by-Step Process

---

### Step 1 — Audit all hardcoded text

Find static strings in components and routes. Run these searches from the repo root:

```bash
# Module-level constant arrays (e.g. nav item labels)
grep -rn "^const [A-Z_]\+ = \[" artifacts/more-health-remix/app/

# Hardcoded strings in JSX (adjust search terms for your project)
grep -rn "placeholder=\|Welcome back\|Gold Partner\|Wallet Balance" artifacts/more-health-remix/app/

# Chinese characters embedded in JSX
grep -rn "[一-鿿]" artifacts/more-health-remix/app/
```

Group every hit into two buckets:
- **`common`** — text used across multiple pages (nav labels, sidebar, header, page headings)
- **`[page]`** — text used only on one route (dashboard charts, activity feed labels, etc.)

---

### Step 2 — Install packages

Run from the Remix app package (not the monorepo root):

```bash
cd artifacts/more-health-remix
pnpm add i18next react-i18next remix-i18next i18next-fs-backend i18next-http-backend i18next-browser-languagedetector
```

---

### Step 3 — Create locale JSON files

Create the directory structure:

```bash
mkdir -p public/locales/en public/locales/zh
```

**`public/locales/en/common.json`** — one key per shared UI concern:

```json
{
  "nav": {
    "dashboard": "Dashboard",
    "shop": "Shop Products",
    "settings": "Settings"
  },
  "sidebar": {
    "walletBalance": "Wallet Balance"
  },
  "header": {
    "searchPlaceholder": "Search orders, partners, products...",
    "languageToggle": "EN / 中"
  },
  "pages": {
    "settings": { "title": "Settings", "subtitle": "设置" },
    "orders":   { "title": "Orders",   "subtitle": "订单" }
  }
}
```

**`public/locales/zh/common.json`** — same keys, Chinese values; page subtitles flip (title becomes Chinese, subtitle becomes English):

```json
{
  "nav": {
    "dashboard": "仪表盘",
    "shop": "商城",
    "settings": "设置"
  },
  "sidebar": {
    "walletBalance": "钱包余额"
  },
  "header": {
    "searchPlaceholder": "搜索订单、伙伴、产品...",
    "languageToggle": "中 / EN"
  },
  "pages": {
    "settings": { "title": "设置",  "subtitle": "Settings" },
    "orders":   { "title": "订单",  "subtitle": "Orders" }
  }
}
```

**`public/locales/en/dashboard.json`** — dashboard-specific copy:

```json
{
  "hero": {
    "greeting": "Welcome back, {{name}}",
    "greetingSecondary": "欢迎回来",
    "partnerBadge": "Gold Partner / 金牌伙伴",
    "walletBalance": "Wallet Balance",
    "weeklyEarnings": "Earnings This Week",
    "ordersGenerated": "Orders Generated"
  },
  "charts": {
    "salesTrend": "Sales Trend",
    "days": "{{count}} Days",
    "salesTooltip": "Sales",
    "earningsGrowth": "Earnings Growth",
    "earningsTooltip": "Earnings",
    "weekOf": "Week of {{week}}"
  },
  "trafficSources": "Traffic Sources",
  "activity": {
    "title": "Recent Activity",
    "viewAll": "View All"
  },
  "kpi": {
    "compare": "vs. previous 7 days"
  }
}
```

**Rules for structuring JSON:**
- Use `{{variableName}}` syntax for interpolated values (e.g. `"Welcome back, {{name}}"`)
- One top-level key per UI section — makes it easy to see what belongs together
- Keep color values or icon names out of JSON (they belong in code)
- Every key in `en/` must exist in `zh/` with the same structure

---

### Step 4 — Create the shared i18n config

**`app/i18n.ts`**

```ts
export default {
  supportedLngs: ["en", "zh"],
  fallbackLng: "en",
  defaultNS: "common",
  ns: ["common", "dashboard"],  // list every namespace you created
};
```

Add new namespaces to `ns` as pages get content.

---

### Step 5 — Create the server-side i18next instance

**`app/i18next.server.ts`**

```ts
import Backend from "i18next-fs-backend";
import { resolve } from "node:path";
import { RemixI18Next } from "remix-i18next/server";
import i18n from "~/i18n";

export default new RemixI18Next({
  detection: {
    supportedLanguages: i18n.supportedLngs,
    fallbackLanguage: i18n.fallbackLng,
  },
  i18next: {
    ...i18n,
    backend: {
      loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json"),
    },
  },
  plugins: [Backend],
});
```

`resolve("./public/locales/...")` resolves relative to `process.cwd()`, which is the package root where `package.json` lives.

---

### Step 6 — Wire up the client entry point

Replace the contents of **`app/entry.client.tsx`**:

```tsx
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend from "i18next-http-backend";
import { getInitialNamespaces } from "remix-i18next/client";
import i18n from "~/i18n";

async function hydrate() {
  await i18next
    .use(initReactI18next)
    .use(LanguageDetector)
    .use(Backend)
    .init({
      ...i18n,
      ns: getInitialNamespaces(),
      backend: { loadPath: "/locales/{{lng}}/{{ns}}.json" },
      detection: {
        order: ["htmlTag"],   // reads the lang attribute set by the server
        caches: [],
      },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <HydratedRouter />
      </StrictMode>
    );
  });
}

hydrate();
```

Key points:
- `getInitialNamespaces()` loads only the namespaces the current page uses — no over-fetching
- `order: ["htmlTag"]` means the client reads language from `<html lang="...">` set by the server — no mismatch

---

### Step 7 — Update the root loader and layout

In **`app/root.tsx`**, make three additions:

**1. Imports:**
```ts
import type { LoaderFunctionArgs } from "react-router";
import { useLoaderData, useRouteLoaderData } from "react-router";
import { useChangeLanguage } from "remix-i18next/react";
import i18next from "~/i18next.server";
```

**2. Loader — detect locale and merge with any existing data:**
```ts
export async function loader({ request }: LoaderFunctionArgs) {
  const locale = await i18next.getLocale(request);
  return { locale, /* ...other root data e.g. userData */ };
}
```

**3. Layout — make `<html lang>` dynamic:**
```tsx
export function Layout({ children }: { children: React.ReactNode }) {
  const data = useRouteLoaderData<typeof loader>("root");
  return (
    <html lang={data?.locale ?? "en"}>
      ...
    </html>
  );
}
```

**4. App — call useChangeLanguage so react-i18next tracks locale changes:**
```tsx
export default function App() {
  const { locale } = useLoaderData<typeof loader>();
  useChangeLanguage(locale);
  return <Outlet />;
}
```

---

### Step 8 — Update shared components

For every shared component that has hardcoded copy:

```tsx
import { useTranslation } from "react-i18next";

export function Sidebar() {
  const { t } = useTranslation("common");
  // ...
  <span>{t("sidebar.walletBalance")}</span>
  <span>{t(`nav.${item.id}`)}</span>   // dynamic key from item.id
}
```

**For interpolated strings:**
```tsx
t("hero.greeting", { name: user?.firstName })
// matches "Welcome back, {{name}}" in the JSON
```

**For tooltip formatters (callbacks outside JSX):**
```tsx
// t is captured in closure — works correctly
formatter={(val) => [`¥${val}`, t("charts.salesTooltip")]}
labelFormatter={(label) => t("charts.weekOf", { week: label })}
```

**For optional props with a translated default:**
```tsx
// Remove the hardcoded default from the prop signature
// Use t() as the fallback in JSX instead:
{compare ?? t("kpi.compare")}
```

---

### Step 9 — Update route page files

For each route that has a hardcoded heading:

```tsx
import { useTranslation } from "react-i18next";

export default function SettingsPage() {
  const { t } = useTranslation("common");
  return (
    <AppLayout>
      <div>
        <h1>{t("pages.settings.title")}</h1>
        <p>{t("pages.settings.subtitle")}</p>
      </div>
    </AppLayout>
  );
}
```

Meta titles (browser tab) are left as hardcoded strings. Translating them requires a different pattern — see **Known Limitations** below.

---

### Step 10 — Verify

```bash
pnpm --filter more-health-remix typecheck
pnpm --filter more-health-remix dev
```

Open `http://localhost:5173` and confirm:
- All text renders (no blank labels, no `pages.settings.title` showing as raw key)
- Dashboard hero, KPI labels, chart titles, nav labels all display correctly
- No console errors about missing translation keys

---

## Commands Reference

| Action | Command |
|---|---|
| Install packages | `pnpm add i18next react-i18next remix-i18next i18next-fs-backend i18next-http-backend i18next-browser-languagedetector` |
| Find hardcoded JSX strings | `grep -rn "placeholder=\|Welcome back" artifacts/more-health-remix/app/` |
| Find embedded Chinese characters | `grep -rn "[一-鿿]" artifacts/more-health-remix/app/` |
| Type check | `pnpm --filter more-health-remix typecheck` |
| Run dev server | `pnpm --filter more-health-remix dev` |
| Switch default language (quick test) | Change `fallbackLng: "en"` → `"zh"` in `app/i18n.ts` |

---

## How to Add a New Page with Translations

When a previously empty route (e.g. `/orders`) gets real content:

1. Create `public/locales/en/orders.json` and `public/locales/zh/orders.json` with the page copy
2. Add `"orders"` to the `ns` array in `app/i18n.ts`
3. In the route file, call `useTranslation("orders")` and use `t("...")` in JSX
4. Run `pnpm typecheck` to verify

---

## How to Add a Third Language

1. Create `public/locales/[new-lang]/common.json` and any page namespace files, matching the `en/` key structure exactly
2. Add the language code to `supportedLngs` in `app/i18n.ts`
3. Done — the language detector and `<html lang>` mechanism handle the rest

---

## Known Limitations

**Meta titles are not translated.** Browser tab titles like `"Settings – More Health"` remain hardcoded strings in each route file. Translating them server-side requires calling `i18next.getFixedT(request, "common")` inside each route's `loader` and returning the translated title, then reading it back via `MetaFunction`. This is a separate pattern and was intentionally left out of this task.

**KPI labels come from the data layer, not i18n keys.** The label values in `dashboard.json` (`"Total Orders"`, etc.) are returned from the loader and passed as props. They are not run through `t()`. When the real API arrives, the API response should return labels in the correct language server-side. If client-side label translation is needed, move the labels to the `dashboard` namespace and look them up by a key instead.

**No language toggle wiring yet.** The language toggle button in TopHeader renders the label from `t("header.languageToggle")` but has no `onClick` handler. To wire it up: `onClick={() => i18next.changeLanguage(i18next.language === "en" ? "zh" : "en")}`. The rest of the infrastructure already supports it.

---

## Completed In

Branch: `move-dummydata-to-ssr-json` — June 2026
Files created: `app/i18n.ts`, `app/i18next.server.ts`, `public/locales/en/common.json`, `public/locales/en/dashboard.json`, `public/locales/zh/common.json`, `public/locales/zh/dashboard.json`
Files modified: `app/entry.client.tsx`, `app/root.tsx`, `app/components/shared/Sidebar.tsx`, `app/components/shared/TopHeader.tsx`, `app/components/shared/Kpi.tsx`, `app/components/mockups/Dashboard.tsx`, all 12 route files under `app/routes/`
