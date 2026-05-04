# CLAUDE.md — Nalewkarz Master

## Development Commands

```bash
npm run dev       # start Vite dev server (localhost:5173)
npm run build     # production build → dist/
npm run preview   # preview production build locally
```

No test suite exists in this project.

## Project Overview

**Nalewkarz Master** (EBRA Rzemiosło) is a nalewka (Polish fruit liqueur) recipe management web application built as a Vite/React SPA. Part of the EBRA Rzemiosło calculator ecosystem.

- **Firebase project:** `masarski-pro-v2` (shared with masarz-claude)
- **Hosting:** `nalewki.ebra.pl` (FTP deploy via GitHub Actions)
- **Dev server:** `http://localhost:5173`
- **Accent color:** `#7c3aed` (violet-600)

## Stack

- React 18.3 + Vite 5.4
- Tailwind CSS 3.4 (dark mode via `data-theme="dark"` on `<html>`)
- Firebase 10.13 (Auth + Firestore, region: `europe-central2`)
- Stripe (payment links, not Elements)
- vite-plugin-pwa 0.20 (PWA with autoUpdate)

## Project Structure

```
src/
  components/
    AdBanner.jsx        ad banners from Firestore ads/
    AdminPanel.jsx      superadmin panel (users, ads, moderation)
    AuthModal.jsx       login modal (Google, Facebook, email)
    BottomNav.jsx       5-tab bottom nav (home|recipes|my|calculator|account)
    Calculator.jsx      nalewka recipe calculator — main product feature
    ClientPanel.jsx     user account panel (profile, subscription)
    Header.jsx          header with EBRA logo and theme toggle
    HomeScreen.jsx      landing page with calculator/recipes/my cards
    MyRecipes.jsx       user's own recipes + favorites
    RecipeList.jsx      admin recipe list with category filter
    RecipeModal.jsx     add/edit nalewka recipe modal
    SuccessPage.jsx     post-Stripe payment success page
  hooks/
    useTheme.js         dark/light mode persistence (key: ebra-theme)
  App.jsx               tab routing + global user state
  firebase.js           exports: auth, db, SUPER_ROOT, MYDEVIL_URL, COL_RECIPES, COL_CATEGORIES
  stripe.js             STRIPE_PLANS array with payment links
  main.jsx              entry point, PWA prompt, route /success
  index.css             CSS variables (--bg: #0f0d14, --accent: #7c3aed) + Tailwind base
```

## Firestore Collections

| Collection | Description |
|---|---|
| `nalewki_recipes/{id}` | nalewka recipes |
| `nalewki_categories/{id}` | recipe categories |
| `users/{uid}` | user profiles (shared with masarz) |
| `ads/{id}` | ad banners (shared with masarz) |
| `settings/pricing` | plan config (shared with masarz) |

### Nalewka Recipe Model (`nalewki_recipes/{id}`)

```js
{
  name: string,
  category: string,
  spirit_volume: number,        // ml spirytusu 96%
  target_strength: number,      // % docelowej mocy
  fruits: [{ name, weight_g, juice_yield_pct }],
  sugar_g: number,
  water_syrup_ml: number,
  maceration_days: number,
  maceration_temp_c: number,
  aging_days: number,
  calc_water_ml: number,        // obliczone
  calc_total_ml: number,        // obliczone
  calc_final_strength: number,  // obliczone
  calc_juice_ml: number,        // obliczone
  imageUrl: string,
  ownerId: string,              // uid lub 'ADMIN'
  updatedAt: Timestamp,
  blocked?: boolean,
}
```

## Calculator Formulas

```
V_alkohol = spirit * scale * 0.96
V_juice   = sum(fruit.weight * scale * fruit.yieldPct / 100)
V_syrup   = sugar * scale * 0.63 + wSyrup * scale
V_woda    = (V_alkohol / (targetMoc/100)) - spirit*scale - V_juice - V_syrup
V_total   = spirit*scale + max(0, V_woda) + V_juice + V_syrup
finalMoc  = V_alkohol / V_total * 100
```

If V_woda < 0: show warning "Zmniejsz moc docelową lub dodaj mniej spirytusu".

## Navigation Tabs

`home | recipes | my | calculator | account | superadmin`

- BottomNav shows: home, recipes, my, calculator, account (5 tabs)
- `superadmin` accessed via LayoutDashboard icon in Header (admins only)
- Clicking a recipe in RecipeList → loads it into Calculator tab

## User Profile (`users/{uid}`)

```js
{
  email: string,
  plan: 'free' | 'mini' | 'midi' | 'maxi' | 'vip',
  tools: string[],        // includes 'nalewkarz'
  isAdmin: boolean,
  favorites: string[],    // nalewki_recipes IDs
  recipeCount: number,
  createdAt: string       // ISO 8601
}
```

## Plans

| Plan | Limit | Price |
|---|---|---|
| free | 2 | 0 zł |
| mini | 10 | 12 zł/rok |
| midi | 20 | 20 zł/rok |
| maxi | 30 | 30 zł/rok |
| vip | 100 | 60 zł/rok |

Trial 21 days = VIP access, computed client-side from `users/{uid}.createdAt`.

## Coding Rules

- Components: JSX (not TSX), no PropTypes
- Style: Tailwind inline classes, CSS variables for brand colors (--accent: #7c3aed)
- Firestore: `onSnapshot` for real-time data, `getDoc/setDoc` for one-off reads
- No React Router — navigation via `setActiveTab`
- Images uploaded via `MYDEVIL_URL` (not Firebase Storage)
- Always check `plan` and `recipeCount` before saving new recipe
- Accent color: `violet-600` (#7c3aed), NOT red

## Deploy

```bash
npm run build           # → dist/
# FTP deploy to nalewki.ebra.pl via GitHub Actions
firebase deploy --only firestore:rules   # from masarz-claude/
```

## Admin

Superadmin: `krzysiekgodek@gmail.com` (hardcoded in `firestore.rules` and `firebase.js`).

## Znane pułapki (UI)

### Klasa `logo-img` w `src/index.css`
```css
.logo-img { filter: brightness(0) invert(1); }
[data-theme="light"] .logo-img { filter: brightness(0) invert(0); }
```
Klasa ta zamienia logo na jednolity biały (dark mode) lub czarny (light mode) prostokąt.
Działa poprawnie tylko dla obrazów PNG z przezroczystym tłem (np. masarz_logo.png).
**Nie używaj `logo-img` dla `nalewki_logo.jpg`** — ten plik ma ciemne tło i musi renderować się naturalnie.
W `Header.jsx` logo nalewki używa klasy `h-8 w-auto rounded` (bez `logo-img`).

### HomeScreen — karty kalkulatorów
- Wysokość baneru: `h-48`
- Logo: `absolute top-3 h-14 w-14 object-contain drop-shadow-lg`, wyśrodkowane w `left: 25%` via `transform: translateX(-50%)`
- Napis: `absolute left-0 right-0 px-4`, `top: 108px` (= 12px + 56px logo + 40px odstęp)
- Nazwa: `text-2xl font-extrabold drop-shadow leading-tight`
- Opis: `text-base text-white/80 mt-1`
- Nalewki otwierają wewnętrzną zakładkę `recipes` (`tab: 'recipes'`, bez `url`)
- Masarski i Piekarski otwierają zewnętrzne linki z `#receptury`
