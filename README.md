# Yousuf Enterprise — Wholesale Ordering Website

Phase 1 scaffold: React (Vite) + Supabase, with authentication and the core
database schema (profiles, categories, products, variants, orders, order
items, addresses) plus Row Level Security.

## Business info on file
- Yousuf Enterprise
- Email: yousufenterprise126@gmail.com
- Tel: 02-55014151 | Phone: 01590089369, 01977222126
- Address: Shop 56 Kabbakash Super Market (1st floor), 3/D Plot, Karwan Bazar, Tejgaon, Dhaka 1215

## 1. Create a Supabase project
1. Go to supabase.com → New project (this counts as your 2nd free project if the
   hostel-app project is still active — pause/delete an unused one if you hit
   the 2-project free limit).
2. In the SQL Editor, paste and run `supabase/schema.sql` from this repo.
3. In Authentication → Providers, enable Email and (optionally) Google.
   Phone/SMS OTP needs a paid SMS provider (Twilio etc.) configured separately —
   mention this cost to the client if they want phone OTP.
4. In Project Settings → API, copy the Project URL and anon public key.

## 2. Configure the app
```bash
cp .env.example .env
# then edit .env and paste your Supabase URL + anon key
```

## 3. Install & run
```bash
npm install
npm run dev
```

## 4. Make yourself admin
After signing up once through the app, run this in the Supabase SQL editor
(replace the email):
```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```

## What's included in this Phase 1 scaffold
- Email/password signup + login, Google login button (wire up the provider in
  Supabase to activate it)
- Auth context (`src/context/AuthContext.jsx`) exposing `user`, `profile`,
  `isAdmin`
- Protected routes for logged-in customers and admin-only pages
- Home page pulling categories live from Supabase
- Placeholder My Orders and Admin Dashboard pages (stats only)
- Full DB schema + RLS policies for the whole system (products, variants,
  orders, order_items, addresses) — ready for Phase 2/3/4 features even
  though the UI for them isn't built yet

## Next phases (not built yet)
- **Phase 2**: category pages, product listing/detail, image upload
- **Phase 3**: cart, checkout, order placement, My Orders detail view
- **Phase 4**: full admin panel — product CRUD, order status updates,
  customer list
- **Phase 5**: validation, loading/error states, responsive polish, deploy
