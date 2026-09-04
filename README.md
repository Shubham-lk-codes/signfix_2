# SignFix

Project file map: [docs/FOLDER_STRUCTURE.md](docs/FOLDER_STRUCTURE.md)

Technician mobile API integration: [docs/technician-api.md](docs/technician-api.md)

Sign board sales, service, maintenance and field-operations platform by **DL SSR INFOTECH**. The repository contains a responsive React operations console, a secured Node/Express REST API, and a PostgreSQL relational schema. Customer and technician API contracts are retained for future mobile clients; native mobile applications are outside this build scope.

## Run locally

```bash
npm install
npm run dev       # starts React at :5173 and the API at :4000 together
npm run server    # starts only the API at http://localhost:4000
```

Demo accounts use `SignFix@123`: `customer@signfix.in`, `tech@signfix.in`, and `admin@signfix.in`.

## Business invariants

- Customer calculator values are always labelled **Estimated Price**.
- Only an admin-approved quotation is an official commercial amount.
- Asset QR tokens reveal no customer information without authenticated authorization.
- AI suggestions are concepts and cannot promise feasibility, price, or delivery dates.

## Architecture

- `src/api`, `src/context`, `src/hooks`: API client, authentication state and browser routing.
- `src/components`: reusable layouts and UI components.
- `src/pages/admin`: responsive operations console modules.
- `src/pages/customer`: mobile-first ordering, service, AI support and design-demo workflows.
- `src/pages/technician`: mobile-first field job dashboard and status workflow.
- `server/routes`: REST endpoint declarations grouped by domain.
- `server/controllers`: HTTP orchestration and validation boundaries.
- `server/middleware`: JWT authentication, role authorization, validation and errors.
- `server/database.js`: parameterized PostgreSQL repository operations.
- `database`: PostgreSQL schema and idempotent development seed.

Configure `JWT_SECRET`, database credentials, object storage, maps, FCM, and the LLM provider through environment variables before production deployment.

Customer mobile integration endpoints and payload flow are documented in [`docs/customer-api.md`](docs/customer-api.md).

## Brand assets

The supplied SignFix artwork is stored once as the text-based `branding/signfix-logo.svg` and reused by the admin favicon/header and both Flutter apps. The app-local and public asset entries are symbolic links, so Git reviews no longer contain unsupported binary image diffs. Native Android/iOS projects should use this SVG as their launcher-icon source during platform packaging.

## Neon database setup

1. Copy `.env.example` to `.env` and change every secret.
2. Create a Neon project and copy its pooled connection string to `DATABASE_URL` in `.env` (keep `sslmode=require`).
3. Run `database/schema.sql` and then `database/seed.sql` in the Neon SQL Editor.
4. Start the API with `npm run server`. Without `DATABASE_URL`, the API uses its development-only in-memory store.
5. Check `GET /api/health`: `database.mode` must be `neon-postgres` before production deployment.

Never commit `.env` or use the demo credentials in production.

## Production deployment

- Vercel builds with `.env.production`, so browser API requests go to `https://signfix-2.onrender.com`.
- Render uses `render.yaml`. Add `DATABASE_URL` in the Render service environment; it is intentionally not stored in Git.

### Razorpay payments

Set `PAYMENT_GATEWAY_ENABLED=true`, `PAYMENT_GATEWAY_PROVIDER=razorpay`, and provide test/live values for `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`. Configure the Razorpay webhook URL as `https://<your-host>/api/payments/webhook` and subscribe to `payment.authorized`, `payment.captured`, and `payment.failed`. Use Razorpay Test Mode keys and its separate Test Mode webhook while validating the workflow; credentials must remain in environment variables.

Only a captured transaction whose provider order, amount, currency, and signature match the stored payment can advance an accepted order to production. Calculator estimates are never read by payment creation.
- Render allows both `https://signfix-2.vercel.app` and the local Vite origin through `CORS_ORIGIN`.
- Redeploy both services after pushing configuration changes.
