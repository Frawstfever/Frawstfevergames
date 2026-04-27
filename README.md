# Retro Rack — Video Game E-commerce (Next.js + MongoDB Atlas)

A full Next.js 15 storefront for selling pre-owned / new video games with
per-condition variants (New, CIB, VG with Manual, Disc Only, etc.), local
pickup, shipping calculator, admin panel, and CSV/Google-Sheet price sync.

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind v4,
MongoDB Atlas + Mongoose, Zustand cart, JWT admin auth.
**Hosting:** Vercel (no VPS required).

---

## 1. Run locally

```bash
# From this folder
npm install
npm run seed    # optional — inserts 4 sample listings
npm run dev
```

Open http://localhost:3000

- Storefront: `/`, `/shop`, `/shop/<slug>`
- Cart / checkout: `/cart`, `/checkout`
- Admin: `/admin` — sign in at `/admin/login`

`.env.local` ships with the MongoDB Atlas URI you provided and a default
admin email/password. **Change the admin password and `AUTH_SECRET` before
deploying.**

Generate a strong `AUTH_SECRET`:

```bash
# macOS / Linux
openssl rand -base64 32
# Windows PowerShell
[Convert]::ToBase64String((1..32 | % { Get-Random -Max 256 }))
```

---

## 2. Deploy to Vercel (no VPS)

1. Push this folder to a GitHub repo.
2. Go to https://vercel.com/new and import the repo.
3. Under **Environment Variables**, add every key from `.env.example`
   (copy values from your `.env.local`, but use a **strong** `AUTH_SECRET`
   and a **strong** `ADMIN_PASSWORD`).
4. Click **Deploy**. Vercel hosts the whole thing — API routes become
   serverless functions, static pages are on the edge.
5. (Optional) Add a custom domain from the Vercel dashboard.

### MongoDB Atlas network access
In Atlas → Security → Network Access, add `0.0.0.0/0` (allow from
anywhere) so Vercel's serverless functions can connect. The Atlas
username/password in `MONGODB_URI` still gates access.

---

## 3. How the features map to your brief

| You asked for | Where it lives |
|---|---|
| Customers buy from the site + shipping calc | `/checkout` + `src/lib/shipping.ts` (weight-based table, domestic + international, swap in EasyPost/Shippo later) |
| Dropdown for per-copy condition (New, VG w/ manual, disc only…) | `src/components/ProductBuy.tsx` uses the variant list; conditions defined in `src/lib/conditions.ts` |
| Local pickup | Toggle on each product + fulfillment choice at checkout (`/checkout`) |
| Easy inventory management | `/admin/products` (list, search, edit, delete, duplicate) |
| Add new items | `/admin/products/new` |
| Manage stock | Stock field per variant in the product form; stock auto-decrements on order |
| Pull API/spreadsheet price data | `/admin/pricing` — sync from a published Google Sheet CSV URL (or paste CSV). Matches rows to variants by SKU |
| Duplicate a listing | "Duplicate" button on each row in `/admin/products` (copies everything, zeros stock, suffixes SKUs) |
| Mobile-friendly, fun design | Tailwind v4, responsive grid, neon/retro theme |

### Duplicate workflow
Hit **Duplicate** on any product in `/admin/products`. You land on the
edit page of the new copy, already populated with all fields, variants,
images — just tweak the title/SKUs and save.

### PriceCharting live sync (recommended)
1. Set `PRICECHARTING_TOKEN` in your env (comes from the `t=` param in any
   of your PriceCharting custom-guide links; an API subscription is required).
2. On each product's edit page, use **Search PriceCharting** to link the
   listing to a PriceCharting product ID. The current loose / CIB / new
   prices are pulled in and shown on the product.
3. Go to `/admin/pricing` → **Run PriceCharting sync** to refresh reference
   prices for every linked product. Tick *Also update each variant's selling
   price* (with a markup %) to push the PC prices straight into your listings.
4. Condition → PriceCharting price mapping:
   - `NEW` → `new-price`
   - `CIB` / `VG — Complete (w/ Manual)` → `cib-price`
   - `VG — No Manual` / `Good` / `Well Used` / `Disc / Cart Only` → `loose-price`
   - `Box Only` → `box-only-price`
   - `Manual Only` → `manual-only-price`
5. **Download my custom CSV** button on the pricing page streams your
   PriceCharting custom price guide CSV through the admin (keeps the token
   server-side so it never hits the browser).

### CSV/Google-Sheet price sync
1. Build a Google Sheet with columns: `sku, price, stock, reference_price`
   (`slug` also accepted for product-level references).
2. File → Share → **Publish to web** → choose "Comma-separated values (.csv)".
3. Copy the URL, paste it into `/admin/pricing` (or set `PRICE_SHEET_CSV_URL`
   in env and leave blank). Pick a mode, hit **Run CSV sync**.
4. You get back a JSON report: rows seen, variants matched/updated,
   any SKUs that didn't match.

You can also POST CSV directly to `POST /api/admin/pricing/sync`
as `{ "csv": "..." }` for scripted imports.

---

## 4. Project structure

```
src/
  app/
    page.tsx                 # home
    shop/page.tsx            # browse / filter
    shop/[slug]/page.tsx     # product detail with variant dropdown
    cart/page.tsx
    checkout/page.tsx
    checkout/success/page.tsx
    admin/                   # protected by middleware
      layout.tsx
      page.tsx               # dashboard
      login/page.tsx
      products/page.tsx
      products/new/page.tsx
      products/[id]/edit/page.tsx
      orders/page.tsx
      pricing/page.tsx       # CSV sync UI
    api/
      orders/route.ts        # POST to place an order (decrements stock)
      shipping/route.ts      # GET — returns a shipping quote
      auth/login/route.ts
      auth/logout/route.ts
      admin/
        products/route.ts
        products/[id]/route.ts
        products/[id]/duplicate/route.ts
        orders/[id]/route.ts              # update status
        pricing/sync/route.ts             # CSV sync
        pricecharting/search/route.ts     # PC search proxy
        pricecharting/product/[id]/route.ts  # PC lookup proxy
        pricecharting/sync/route.ts       # bulk PC reference/price sync
        pricecharting/custom-csv/route.ts # pipe PC custom CSV through admin
  components/
    Nav.tsx  Footer.tsx
    ProductCard.tsx  ProductBuy.tsx
    admin/
      ProductForm.tsx  RowActions.tsx
      LogoutButton.tsx  OrderStatusSelect.tsx
  lib/
    mongodb.ts  auth.ts  cart-store.ts  shipping.ts
    conditions.ts  csv.ts  money.ts  slug.ts
  models/
    Product.ts  Order.ts
  middleware.ts          # protects /admin/* and /api/admin/*
scripts/
  seed.ts                # inserts 4 example listings
```

---

## 5. Payments

The current checkout records an order and decrements stock; the customer
receives an order number and you email/message them a payment link (Venmo,
Zelle, PayPal, Stripe payment link, etc.).

To wire real card checkout, add a Stripe Checkout Session route — happy to
add that on request once we decide on the payment provider and business
entity.

---

## 6. Condition codes (edit in `src/lib/conditions.ts`)

| Code | Label |
|---|---|
| `NEW` | New / Sealed |
| `LN` | Like New |
| `VG_CM` | VG — Complete (w/ Manual) |
| `VG_NM` | VG — No Manual |
| `G` | Good |
| `WU` | Well Used |
| `DO` | Disc / Cart Only |
| `CIB` | CIB (Case + Manual) |
| `BOX` | Box Only |
| `MAN` | Manual Only |

Add/remove or rename freely — the store will pick them up.

---

## 7. Security notes

- Admin auth is a signed JWT in an httpOnly cookie, enforced by
  `src/middleware.ts`. Admin email/password come from env vars — there is
  no public sign-up.
- The MongoDB URI in `.env.local` was provided in chat; rotate that
  password in Atlas before going to production, and never commit
  `.env.local` (it's in `.gitignore`).
- `AUTH_SECRET` must be a strong random string in production.
