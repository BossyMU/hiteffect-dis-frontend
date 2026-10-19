# Hit Effect · Distributor Portal

The web app shops and admins use for Hit Effect's TCG distribution: pre-order rounds with fair allocation, offers accepted with a 30% deposit, balance payments before shipping, and regular orders from stock.

Data comes from the REST API in [hiteffect-dis-backend](../hiteffect-dis-backend).

It's built the same way as [stock-hiteffect-frontend](../stock-hiteffect-frontend) (stack, folder structure, components), in the Hit Effect brand from [hiteffect-frontend](../hiteffect-frontend): Inter, IBM Plex Mono and Cinzel, orange accent, cyan outlines, light surfaces, the logo, and the gradient on the login screen.

## Tech stack

- [React 19](https://react.dev) and TypeScript
- [Vite](https://vite.dev) for the dev server and build
- [Tailwind CSS v4](https://tailwindcss.com), with design tokens in `src/styles/index.css`
- [React Router](https://reactrouter.com) for page routing
- ESLint and Prettier

## Getting started

By default the frontend calls the hosted backend on Vercel: `https://hiteffect-dis-backend.vercel.app/api`.

```bash
nvm use                  # Node version from .nvmrc
npm install
npm run dev              # http://localhost:5173
```

**Using a local backend.** Start hiteffect-dis-backend with `npm run dev` (see its README). Then do one of these:

- In `src/api/client.ts`, comment out the Vercel `DEFAULT_API_BASE_URL` line and uncomment the `localhost` one.
- Or, without editing code: `cp .env.example .env` and uncomment `VITE_API_BASE_URL=http://localhost:3000/api`.

Log in with the admin from the backend's `.env` (`ADMIN_EMAIL` / `ADMIN_PASSWORD`). With the backend's demo data, you can also log in as `gold.shop@example.com`, `silver.shop@example.com` or `bronze.shop@example.com` (password `shop-demo-123`).

**Before going live,** put your real PromptPay and bank details in `src/constants/company.ts`. They are shown next to every slip upload.

| Variable            | Default                               | What it is                                        |
| ------------------- | ------------------------------------- | ------------------------------------------------- |
| `VITE_API_BASE_URL` | the Vercel URL in `src/api/client.ts` | Backend URL, including the `/api` prefix          |
| `VITE_BASE_PATH`    | `/`                                   | Path the app is served from (set by CI for Pages) |

| Script              | What it does                         |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the dev server with hot reload |
| `npm run build`     | Type-check, then build to `dist/`    |
| `npm run preview`   | Serve the production build locally   |
| `npm run lint`      | Run ESLint                           |
| `npm run format`    | Format all files with Prettier       |
| `npm run typecheck` | Run the TypeScript compiler only     |

## Pages

One app, two roles. Shops and admins log in on the same page and see different menus.

| Route                    | Who   | What you can do                                                                                                                                                                                                  |
| ------------------------ | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`, `/register`    | all   | Log in; a new shop requests an account (an admin approves it and picks a tier)                                                                                                                                   |
| `/`                      | shop  | What needs action: offers to answer, open pre-orders, amounts to pay; notifications                                                                                                                              |
| `/products`              | shop  | Products sold from stock, as a card grid (search, category, set, sort, in stock only): add boxes to the cart                                                                                                     |
| `/products/:id`          | shop  | One product: photo, tier price, stock, quantity and **Add to cart**                                                                                                                                              |
| `/preorders`             | shop  | Pre-orders open for requests (before the deadline), as the same kind of card grid: request boxes. Once requests close they move to My pre-orders                                                                 |
| `/my-preorders`          | shop  | (Menu item) Track every pre-order the shop took part in: a step tracker (request → offer → deposit → stock → balance → shipped), what was asked, offered and accepted, what is paid and due, and the next action |
| `/preorders/:id`         | shop  | One pre-order: quantity and **Request boxes** (no payment), then accept the offer with the deposit slip, or decline; the steps and dates                                                                         |
| `/cart`                  | shop  | The cart: change quantities, add a note, **Place order**; also lists the shop's open pre-order requests                                                                                                          |
| `/orders`, `/orders/:id` | shop  | Track orders; pay the balance or a regular order with a slip                                                                                                                                                     |
| `/profile`               | all   | Contact, shipping and tax invoice details; password                                                                                                                                                              |
| `/admin`                 | admin | Slips to check, orders to ship, shops to approve; run the deadline check                                                                                                                                         |
| `/admin/rounds`          | admin | Create rounds; each round page walks through open → allocate → publish → arrive → close, or cancel before offers                                                                                                 |
| `/admin/payments`        | admin | View slips and confirm or reject them                                                                                                                                                                            |
| `/admin/orders`          | admin | Ship paid orders (with tracking number); cancel orders                                                                                                                                                           |
| `/admin/products`        | admin | Products, tier prices, stock corrections and the stock ledger                                                                                                                                                    |
| `/admin/shops`           | admin | Approve shops, set tier and history bonus; edit tiers                                                                                                                                                            |

## Project structure

```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Providers and route table (role guards)
├── routes/paths.ts          # Route path constants
├── styles/index.css         # Tailwind setup and Hit Effect design tokens
│
├── components/              # Shared, reusable components
│   ├── ui/                  # Generic building blocks (Button, Modal, DataTable, badges, …)
│   ├── layout/              # App shell: Sidebar, mobile bars, login layout, route guards
│   ├── orders/              # Order summary, used by shop and admin pages
│   ├── payments/            # Slip upload fields
│   └── notifications/       # Notification list
│
├── pages/                   # One folder per area
│   ├── auth/                # Login, sign-up
│   ├── shop/                # Catalog tabs, product and pre-order pages, cart
│   │   └── components/      # Components used only by shop pages
│   ├── admin/components/    # Components used only by admin pages
│   └── profile/
│
├── api/                     # Backend client: fetch wrapper (adds the token) and one module per role
├── context/                 # AuthContext (login), CartContext (shop cart), ToastContext (action results)
├── hooks/                   # useApiData (load a page's data), usePagination
├── constants/               # Status labels and tones, payment details
├── types/                   # Domain types, matching the API
└── utils/                   # Formatting, dates, image shrinking, class-name helper
```

### Conventions

- **Where a component goes.** Used by more than one page → `src/components/`. Used by one area only → `src/pages/<area>/components/`.
- **Styling.** Tailwind classes with the theme tokens (`bg-card`, `text-muted-foreground`, `text-primary-strong`, `border-ring`, …). Don't hard-code hex values in components; edit `src/styles/index.css`. Use `text-primary-strong` (not `text-primary`) for orange text, so it stays readable on white.
- **Dynamic colors.** Statuses map to a _tone_ in `src/constants/status.ts`; tone classes are spelled out in `src/constants/tone.ts` so Tailwind can detect them.
- **Imports.** `@/` points to `src/`.
- **Catalog.** Products and Pre-orders are tabs of one catalog (`src/pages/shop/components/ShopTabs.tsx`), under **Products** in the shop menu. **My pre-orders** has its own menu item, and the menu is the only way to it. A product with no stock that is taking pre-order requests is only on the Pre-orders tab; once requests close, it is back on Products (sold out) and the shop follows its pre-order on My pre-orders. Search and filters live in the URL, so "back" from an item page returns to the same view.
- **Cart.** `CartContext` keeps the cart per account in the browser (`localStorage`); the cart page checks it against current stock and prices before the order is placed.
- **Data.** Each page loads its own data with `useApiData()`. Actions go through `run()` from `useToast()`, which shows the error (or a success message) and resolves to `true`/`false`, so modals stay open on failure. All calls go through `src/api/client.ts`.
- **Dates.** Every deadline is 23:59 Bangkok time on the date shown (`formatDeadline`), the same cutoff the backend uses.
- **Slips.** Images are shrunk in the browser (`src/utils/image.ts`) before upload.

## Deployment

The site is hosted on **GitHub Pages**, like stock-hiteffect-frontend. The workflow in `.github/workflows/deploy.yml` runs lint, the format check and the build on every push and pull request, and deploys `dist/` to Pages on pushes to `main`. It builds with `VITE_BASE_PATH=/<repo-name>/` and copies `index.html` to `404.html`, so deep links work.

The backend only accepts requests from origins in its `CORS_ORIGINS` setting. Set it to `https://bossymu.github.io,http://localhost:5173` on Vercel.
