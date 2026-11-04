# Toyes Tech

Online store for new and UK-used phones, laptops, watches, audio and accessories in Nigeria.

## Features
- Product catalogue with variants (storage, RAM, colour) and condition (New / UK Used / Used)
- Shop with category, brand, condition, price and stock filters, plus sorting
- Customer accounts with saved delivery details and order history
- Persistent cart and wishlist
- Paystack checkout flow (currently simulated — add live keys before launch)
- Order tracking and an admin area for products, orders and reviews

## Development
```bash
npm install
npm run dev
```

Set `VITE_ADMIN_PASSWORD` in your environment to change the admin password (default `toyes2026`).
Accounts, orders and admin data are stored in the browser for now; connect a backend before going live.

## Image credits
Product photos in `public/images/products/` are from [Pexels](https://www.pexels.com) (free for commercial use under the Pexels License).
Replace them with photos of your own stock when available.
