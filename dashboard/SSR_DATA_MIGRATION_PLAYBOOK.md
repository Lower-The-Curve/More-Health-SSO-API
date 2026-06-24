# Playbook: Move Dummy Data to SSR JSON

---

## When to Use This

When a Remix route or component has hardcoded data arrays or objects defined directly inside it — and you want to move that data into JSON files that are fetched server-side through Remix loaders. The goal is to keep using dummy data while making the project behave like a real SSR app so the switch to real APIs is easier later.

---

## Prerequisites

- [ ] You are on a dedicated git branch (not main)
- [ ] The app runs locally before you start (`pnpm --filter more-health-remix dev`)
- [ ] You know which files contain the hardcoded data (see Step 1 below if not)

---

## Hard Rules

- Never move navigation config (icon arrays, route definitions) to JSON — icons are React components and cannot be serialized.
- Data that belongs to the **user profile** (name, balance, status) goes in `user.json` and is loaded from `root.tsx`. It appears on every page via `useRouteLoaderData("root")`.
- Data that belongs to a **specific page** (charts, KPIs, feeds) goes in its own JSON file and is loaded by that route's `loader`.
- Keep the old constants in place until the new props are fully wired — delete them last. This keeps the app rendering throughout.

---

## File Structure

After completing this playbook, the data layer looks like:

```
app/
  data/
    user.json          # user profile — loaded by root.tsx loader
    dashboard.json     # dashboard page data — loaded by _index.tsx loader
    [route].json       # one file per route that has data
  root.tsx             # exports loader → returns user.json
  routes/
    _index.tsx         # exports loader → returns dashboard.json
```

---

## Step-by-Step Process

### Step 1 — Find all hardcoded data in components and routes

Search for static arrays and objects defined at the module level inside component files:

```bash
grep -rn "^const [A-Z_]\+ = \[" artifacts/more-health-remix/app/
```

Also look for hardcoded primitive values in JSX (names, balances, dates):

```bash
grep -rn "¥\|Brady\|Gold Partner\|Apr [0-9]" artifacts/more-health-remix/app/
```

For each hit, note:
- Which file it lives in
- Whether it is page-specific data or user-profile data
- The shape of the object (keys and value types)

---

### Step 2 — Create JSON files

Create the `app/data/` directory if it does not exist:

```bash
mkdir -p artifacts/more-health-remix/app/data
```

**For user profile data** (anything that would come from a `/me` or `/profile` API):

Create `app/data/user.json`:

```json
{
  "name": "Full Name",
  "firstName": "First",
  "initials": "FN",
  "avatarUrl": "https://...",
  "partnerStatus": "Gold Partner",
  "walletBalance": "¥12,480.00"
}
```

**For page-specific data** (charts, feeds, KPIs — anything that would come from a dashboard or analytics API):

Create `app/data/[route].json` with one top-level key per UI section:

```json
{
  "hero": { ... },
  "kpis": [ ... ],
  "salesChart": [ ... ],
  "activityFeed": [ ... ]
}
```

Rules for structuring the JSON:
- One top-level key per distinct UI section (hero, kpis, charts, feed, etc.)
- Arrays of objects for lists — match the shape the component already expects
- Keep color values (Tailwind classes) in the JSON if the component maps over them

---

### Step 3 — Wire the root loader for user data

This step only needs to be done once. If the root loader already exists, skip to Step 4.

In `app/root.tsx`, add:

```ts
import userData from "~/data/user.json";

export async function loader() {
  return userData;
}
```

No other changes to `root.tsx` are needed.

Then in any component that needs user data (typically `Sidebar.tsx`), replace hardcoded values with:

```ts
import { useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";

const user = useRouteLoaderData<typeof rootLoader>("root");
```

Then use `user?.name`, `user?.walletBalance`, etc. in JSX.

---

### Step 4 — Add a route loader for page-specific data

For each route that has hardcoded data, open `app/routes/[route].tsx` and add:

```ts
import { useLoaderData } from "react-router";
import dashboardData from "~/data/dashboard.json";  // adjust path per route

export async function loader() {
  return dashboardData;
}

export default function Index() {
  const data = useLoaderData<typeof loader>();
  return <PageComponent data={data} />;
}
```

---

### Step 5 — Update the component to accept and use props

In the component file:

**1. Add a prop type** that matches the JSON structure:

```ts
type DashboardData = {
  hero: {
    currentPeriod: string;
    walletBalance: string;
    // ...
  };
  kpis: Array<{
    label: string;
    value: string;
    delta: string;
    trend: "up" | "down";
    sparklineData: number[];
    sparklineColor: string;
  }>;
  salesChart: Array<{ name: string; value: number }>;
  activityFeed: Array<{
    id: number;
    text: string;
    amount?: string;
    time: string;
    avatar: string;
  }>;
  // ... one key per JSON section
};
```

**2. Update the function signature:**

```ts
export function Dashboard({ data }: { data: DashboardData }) {
```

**3. Replace hardcoded values in JSX** — work section by section:

| Was | Becomes |
|---|---|
| `"Brady"` (string literal) | `{user?.firstName}` |
| `"Apr 11 – Apr 17, 2026"` | `{data.hero.currentPeriod}` |
| `"¥12,480"` | `{data.hero.walletBalance}` |
| `data={SALES_DATA}` | `data={data.salesChart}` |
| `data={EARNINGS_DATA}` | `data={data.earningsChart}` |
| `ACTIVITY_FEED.map(...)` | `data.activityFeed.map(...)` |
| `[{name:'WeChat',...}].map(...)` | `data.trafficSources.map(...)` |
| Four hardcoded `<Kpi>` elements | `{data.kpis.map(kpi => <Kpi ... />)}` |

Do not delete the old constants yet — keep them until the JSX is fully updated and verified. The component must keep rendering while you work.

---

### Step 6 — Remove dead constants

Once every JSX reference has been replaced, delete the old constant declarations from the top of the component file:

```ts
// DELETE these blocks:
const SALES_DATA = [ ... ];
const EARNINGS_DATA = [ ... ];
const ACTIVITY_FEED = [ ... ];
```

Verify the file has no remaining references to the deleted names:

```bash
grep -n "SALES_DATA\|EARNINGS_DATA\|ACTIVITY_FEED" artifacts/more-health-remix/app/components/mockups/Dashboard.tsx
```

No output means the cleanup is complete.

---

### Step 7 — Verify the app still runs

```bash
cd artifacts/more-health-remix
pnpm dev
```

Open `http://localhost:5173` and confirm:
- The dashboard renders with all sections visible
- Charts, KPI cards, and activity feed display correct data
- The sidebar shows the correct user name, status, and wallet balance
- No console errors

---

## Commands Reference

| Action | Command |
|---|---|
| Find hardcoded constant arrays | `grep -rn "^const [A-Z_]\+ = \[" artifacts/more-health-remix/app/` |
| Find hardcoded string values in JSX | `grep -rn "¥\|Gold Partner" artifacts/more-health-remix/app/` |
| Confirm a constant is unused | `grep -n "CONSTANT_NAME" path/to/file.tsx` |
| Run dev server | `pnpm --filter more-health-remix dev` |
| Build check | `pnpm --filter more-health-remix build` |

---

## How to Extend This to a New Route

When a previously empty route (e.g. `/orders`, `/earnings`) gets real dummy data:

1. Create `app/data/orders.json` with the data shaped like the eventual API response
2. In `app/routes/orders.tsx`, add a `loader` that imports and returns it
3. Call `useLoaderData<typeof loader>()` in the default export and pass data as props to the page component
4. Update the page component to accept and render from props
5. Run Step 7 to verify

The pattern is always: **JSON file → loader → useLoaderData → props → JSX**. Never import the JSON file directly inside a component.

---

## Why This Pattern

Remix loaders run on the server before the page HTML is sent. When you swap the JSON import for a real `fetch()` call later, the component and the type definition do not change at all — only the one line inside the loader changes. This is what makes the pattern production-ready from day one.

```ts
// Dummy data (now):
export async function loader() {
  return dashboardData;         // ← JSON import
}

// Real API (later):
export async function loader() {
  return fetch("/api/dashboard").then(r => r.json()); // ← one-line swap
}
```

---

## Completed In

Branch: `move-dummydata-to-ssr-json` — June 2026
Files affected: `root.tsx`, `routes/_index.tsx`, `components/mockups/Dashboard.tsx`, `components/shared/Sidebar.tsx`
JSON files created: `app/data/user.json`, `app/data/dashboard.json`
