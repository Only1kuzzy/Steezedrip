# SteezeDrip Frontend

The SteezeDrip site — React + Vite, single page, no backend required.
Checkout happens on WhatsApp (or manual bank transfer) — there's no
payment gateway wired in, and none of your product data lives in code.
New products are added from a Google Sheet, editable from your phone.

## Managing products (the main thing you'll do day to day)

1. **Make a copy of the products sheet.** Open Google Sheets on your
   phone or a computer, create a new blank sheet, and import
   `products-template.csv` (the file sitting next to this README):
   **File → Import → Upload → pick the file → "Replace current sheet."**
   That gives you the right column headers plus two example rows.

2. **Fill in your products.** One row per product. The columns are:

   | Column | What goes here |
   |---|---|
   | `name` | Product name, e.g. `Not Average Tee` |
   | `category` | Short label shown under the name, e.g. `Graphic Tee` |
   | `filter` | `latest`, `bestseller`, or leave blank |
   | `badge` | Small corner tag: `NEW`, `LIMITED`, `BESTSELLER`, or blank |
   | `price_ngn` | Price in Naira, numbers only, e.g. `45000` |
   | `price_usd` | Price in Dollars, numbers only, e.g. `35` |
   | `description` | A sentence or two about the piece |
   | `colors` | Optional. Comma-separated, e.g. `White,Black,Red`. Leave blank for the default White/Black/Red/Yellow |
   | `sizes` | Optional. Comma-separated, e.g. `S,M,L,XL`. Leave blank for the default S/M/L/XL |
   | `image_url` | Link to the main photo (see step 3) |
   | `image_label` | Optional caption for that photo, e.g. `Front` |
   | `image2_url` | Optional second photo link (e.g. the back) |
   | `image2_label` | Optional caption, e.g. `Back` |
   | `active` | `TRUE` to show it, `FALSE` to hide it without deleting the row (handy when something sells out) |

3. **Get an image link for each photo.** Go to **imgur.com** on your
   phone, tap upload, pick the photo — no account needed. Once it's
   uploaded, tap the photo, then **share/copy the direct image link**
   (it should end in `.jpg`, `.png`, or `.webp`). Paste that into
   `image_url`. Do the same for `image2_url` if you have a second shot.

4. **Publish the sheet so the site can read it.** In Google Sheets:
   **File → Share → Publish to web.** Under "Link", choose your
   product sheet/tab, and set the format dropdown to **Comma-separated
   values (.csv)**. Tap **Publish**. Copy the link it gives you.

5. **Paste that link into the site.** Open `src/App.jsx`, find this line
   near the top:

   ```js
   const SHEET_CSV_URL = "";
   ```

   Paste your link between the quotes, save, and push to GitHub (same
   commit-and-push flow you already know). The site will now read
   products from your sheet.

**From then on, adding or editing a product is just editing a row in
Google Sheets** — no code, no GitHub, no redeploying. The site re-reads
the sheet fresh every time someone loads the page.

Until you set `SHEET_CSV_URL`, the site just shows the 3 launch
products that ship with the code, so it's never blank while you're
setting this up.

## Other things to edit in `src/App.jsx` before going live

- **`WHATSAPP_NUMBER`** (near the top) — your real WhatsApp Business number.
- **Bank details** inside `CheckoutModal` — currently placeholder account info.

## Local setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`.

## Build for production

```bash
npm run build
```

Outputs a static site to `dist/` — that's what you deploy.

## Deploying

Any static host works. **Vercel** or **Netlify** are the easiest:

1. Push this repo to GitHub.
2. On Vercel/Netlify: **New Project → Import** this repo.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Deploy. You'll get a live URL, or you can attach your own domain.

No environment variables are needed for this project — everything
(WhatsApp number, sheet link, bank details) is a plain constant at the
top of `src/App.jsx`.

## Project structure

```
src/
  App.jsx           — the entire site (nav, hero, shop, cart, checkout, etc.)
  main.jsx          — React entry point
  assets/           — brand photos used in the hero/lookbook (bundled, not sheet-driven)
products-template.csv — starter file to import into Google Sheets
```
