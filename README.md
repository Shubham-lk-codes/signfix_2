# SignFix

Sign board sales, service, maintenance and field-operations platform by **DL SSR INFOTECH**. The monorepo contains two Flutter applications, a responsive React operations console, a secured Node/Express REST API, and a MySQL relational schema.

## Run locally

```bash
npm install
npm run dev       # admin at http://localhost:5173
npm run server    # API at http://localhost:4000
```

Run the Flutter clients with the API URL for the target device:

```bash
cd apps/customer_app && flutter pub get && flutter run --dart-define=API_URL=http://10.0.2.2:4000/api
cd apps/technician_app && flutter pub get && flutter run --dart-define=API_URL=http://10.0.2.2:4000/api
```

Use `localhost` for desktop/iOS simulator and the development machine's LAN address for physical devices. Demo accounts use `SignFix@123`: `customer@signfix.in`, `tech@signfix.in`, and `admin@signfix.in`.

## Business invariants

- Customer calculator values are always labelled **Estimated Price**.
- Only an admin-approved quotation is an official commercial amount.
- Asset QR tokens reveal no customer information without authenticated authorization.
- AI suggestions are concepts and cannot promise feasibility, price, or delivery dates.

## Architecture

- `src/`: responsive React admin interface and interaction layer.
- `apps/customer_app/`: customer login, dashboard, connected order calculator/wizard, photo/GPS service request, tracking, and AI support.
- `apps/technician_app/`: technician login, live job queue, navigation, enforced status workflow, evidence upload, notes, materials, and customer OTP completion.
- `server/`: shared REST API with JWT roles, validation, uploads, pricing, customer orders/services, technician jobs, AI guidance, and an admin dashboard feed.
- `database/`: MySQL schema for identity, commerce, field service, assets, AI, notifications, and audit history.

Configure `JWT_SECRET`, database credentials, object storage, maps, FCM, and the LLM provider through environment variables before production deployment.

## Brand assets

The supplied SignFix artwork is stored once as the text-based `branding/signfix-logo.svg` and reused by the admin favicon/header and both Flutter apps. The app-local and public asset entries are symbolic links, so Git reviews no longer contain unsupported binary image diffs. Native Android/iOS projects should use this SVG as their launcher-icon source during platform packaging.

## Database setup

1. Copy `.env.example` to `.env` and change every secret.
2. Run `docker compose up -d mysql`; MySQL automatically applies `database/schema.sql` and `database/seed.sql` on the first clean volume.
3. Start the API with `npm run server`. When `DB_HOST` is set, orders and service requests use MySQL transactions; without it, the API uses an explicitly development-only in-memory store.
4. Check `GET /api/health`: `database.mode` must be `mysql` before production deployment.

To reinitialize local data, run `docker compose down -v` and then `docker compose up -d mysql`. Never use the checked-in demo credentials or local Docker passwords in production.
