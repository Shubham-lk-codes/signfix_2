# SignFix Customer Mobile API

Base URL: `/api`. JSON endpoints require `Authorization: Bearer <token>` except registration and password recovery. Upload endpoints use `multipart/form-data`.

## Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/register` | Register all required customer/company/address fields |
| POST | `/auth/verify-otp` | Verify registration or reset OTP |
| POST | `/auth/login` | Login with `{ email, password, portal: "customer" }` |
| POST | `/auth/forgot-password` | Request reset OTP using email/mobile `identifier` |
| POST | `/auth/reset-password` | Set password using the `resetToken` returned by OTP verification |
| GET | `/auth/me` | Current token identity |
| POST | `/auth/logout` | Revoke the current JWT |

OTP purposes are `verify_registration` and `reset_password`. Development responses include `developmentOtp`; production responses never expose it and should be connected to SMS/email delivery.

## Customer home and profile

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/customer/dashboard` | Active order, service, recent quotation, unread count, and recent activity |
| GET/PATCH | `/customer/profile` | Personal and company profile |
| POST | `/customer/addresses` | Save a delivery/service address |
| DELETE | `/customer/addresses/:id` | Remove an owned address |

## Orders and price calculator

1. Fetch choices with `GET /catalog/products`, `/catalog/materials`, `/catalog/lighting`, and `/catalog/service-categories`.
2. Upload a design/photo/PDF with `POST /uploads`, field name `file` (8 MB maximum).
3. Calculate with `POST /calculator`. Send product, length, width, unit (`ft`, `in`, `cm`, `m`), quantity, material, lighting, and boolean add-ons.
4. Submit the reviewed payload with `POST /orders`.
5. List with `GET /orders`; fetch owned detail with `GET /customer/orders/:orderId`.

The calculator returns `label: "Estimated Price"` and the mandatory admin-review notice. Order IDs use `SB-ORD-YYYY-NNNNNN`.

## Design concepts

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/customer/designs` | Create concept request with sign type, business text, style, lighting, background, and optional storefront URL |
| POST | `/customer/designs/:id/action` | `regenerate`, `request_modification`, `use`, or `send_to_admin` |

These endpoints store concept workflow data. Connect an image-generation provider later to populate `design_concepts.image_url`; every response states that the result is not production artwork.

## Quotations

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/customer/quotations` | List owned quotations |
| GET | `/customer/quotations/:quotationNo` | Quotation detail |
| POST | `/customer/quotations/:quotationNo/action` | `approve` or `request_changes` with optional notes |
| GET | `/customer/quotations/:quotationNo/pdf` | Download PDF |

Payment is intentionally not exposed until a payment gateway and server-side webhook verification are configured.

## Service and tracking

Upload one or more photos, then submit `POST /services` with `category`, `description`, `address`, optional GPS coordinates, `photos`, and priority. List with `GET /services`; track an owned request at `GET /customer/services/:ticketId/tracking`. Service IDs use `SB-SRV-YYYY-NNNNNN`.

The tracking response contains the current status, technician name/contact, location, photos/evidence, estimated visit, and recorded timeline. Supported business statuses are: `submitted`, `under_review`, `technician_assigned`, `accepted`, `on_the_way`, `reached_location`, `inspection_started`, `work_in_progress`, `completed`, `customer_confirmed`, and `closed`.

## AI support, leads, and notifications

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/customer/ai/chat` | Persistent SignFix AI Assistant message |
| GET | `/customer/ai/conversations` | Conversation history |
| POST | `/customer/ai/leads` | Capture requirement/product/budget/contact |
| GET | `/customer/notifications` | Customer push-notification feed |
| PATCH | `/customer/notifications/:id/read` | Mark owned notification read |

The included assistant is a safe deterministic fallback. Replace its reply function with an LLM provider while retaining its disclaimer and escalation rules.

## Deployment checklist

Run `database/schema.sql`, then `database/seed.sql`. Configure `DATABASE_URL`, a strong `JWT_SECRET`, CORS origins, SMS/email OTP delivery, durable object storage (local `/uploads` is development-only), push notification delivery, maps/geocoding, an optional LLM provider, and a payment gateway before production.
