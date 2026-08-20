# SignFix Customer Mobile API

Base URL: `/api`. JSON endpoints require `Authorization: Bearer <token>` except registration and password recovery. Upload endpoints use `multipart/form-data`.

## Required service-area validation

Before accessing customer functionality, call `POST /api/customer/location/validate` with `latitude`, `longitude`, and optional `accuracyMeters`. Send the returned token in `X-Service-Area-Token` on customer, order, and service APIs. The backend verifies that the token belongs to the same customer and has not expired. For permission/GPS failures, send `locationError` as `permission_denied`, `gps_unavailable`, `position_unavailable`, or `timeout` to receive a clear error response.

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
New customer accounts remain in `pending_verification` status and cannot log in until registration OTP verification activates the account.

## Customer home and profile

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/customer/dashboard` | Active order, service, recent quotation, unread count, and recent activity |
| GET/PATCH | `/customer/profile` | Personal and company profile |
| GET | `/customer/orders` | Paginated customer-owned orders; supports `page`, `pageSize`, and `status` |
| GET | `/customer/services` | Paginated customer-owned service tickets; supports `page`, `pageSize`, and `status` |
| POST | `/customer/addresses` | Save a delivery/service address |
| DELETE | `/customer/addresses/:id` | Remove an owned address |

## Orders and price calculator

1. Fetch the complete mobile ordering configuration with `GET /customer/order-options`. It includes sign-board types, materials, lighting, units, add-ons, upload limits, and price copy.
2. Upload a design/photo/PDF with `POST /uploads`, field name `file` (8 MB maximum).
3. Calculate with `POST /calculator`. Send product, length, width, unit (`ft`, `in`, `cm`, `m`), quantity, material, lighting, and boolean add-ons.
4. Submit the reviewed payload with `POST /orders`.
5. List with `GET /orders`; fetch owned detail with `GET /customer/orders/:orderId`.

The calculator returns `label: "Estimated Price"` and the mandatory admin-review notice. Order IDs use `SB-ORD-YYYY-NNNNNN`.
Order submission recalculates pricing on the server and stores the returned cost breakdown; a client-supplied `estimatedPrice` is never trusted.

## Design concepts

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/customer/designs` | Create concept request with sign type, business text, style, lighting, background, and optional storefront URL |
| POST | `/customer/designs/:id/generate` | Queue AI concept generation for an owned design request |
| GET | `/customer/designs/:id` | Poll generation jobs and retrieve generated concepts/image URLs |
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
