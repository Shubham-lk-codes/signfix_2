# Technician API

Base URL: `/api/technician`. JSON requests use `Content-Type: application/json`. Evidence uploads use `multipart/form-data`. All endpoints require `Authorization: Bearer <token>` for a user with the `technician` role.

The response envelope is `{ "data": ... }`. Errors use `{ "error": "message", "details": ... }` with standard HTTP status codes: `401` unauthenticated, `403` forbidden, `404` missing/unassigned job, `409` invalid workflow state, `415` invalid image type, and `422` invalid input.

## Required service-area validation

There is no technician mobile application in this repository. A mobile client must obtain GPS permission and call `POST /api/technician/location/validate` with `latitude`, `longitude`, and optional `accuracyMeters`. Send the returned `accessToken` on every `/api/technician...` request except location validation as `X-Service-Area-Token: <accessToken>`. Authentication APIs do not require it.

A missing token returns `428 LOCATION_VALIDATION_REQUIRED`. An expired token or location outside configured areas returns `403`. When location cannot be obtained, the client can submit `{ "locationError": "permission_denied" }`, `gps_unavailable`, `position_unavailable`, or `timeout` to receive a stable error code and user-facing message.

## Authentication

Authentication is shared with the rest of SignFix:

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Login using `{ "email", "password", "portal": "technician" }` |
| POST | `/api/auth/forgot-password` | Send reset OTP using `{ "identifier": "email-or-mobile" }` |
| POST | `/api/auth/verify-otp` | Verify `{ "identifier", "otp", "purpose": "reset_password" }` |
| POST | `/api/auth/reset-password` | Reset with `{ "resetToken", "password" }` |
| GET | `/api/auth/me` | Current token identity |
| POST | `/api/auth/logout` | Revoke current token |

Login response:

```json
{
  "token": "jwt",
  "user": { "id": 3, "name": "Demo Technician", "email": "tech@signfix.in", "role": "technician" }
}
```

## Profile and dashboard

### `GET /api/technician/dashboard`

Returns counts for `today`, `assigned`, `pending`, `inProgress`, `completed`, and `emergency` jobs. `pending` includes both newly assigned and accepted jobs, while `assigned` is the count of jobs that have not yet been accepted.

Example response:

```json
{
  "data": {
    "today": 4,
    "assigned": 10,
    "pending": 10,
    "inProgress": 3,
    "completed": 7,
    "emergency": 1
  }
}
```

### `GET /api/technician/profile`

Returns technician identity, phone, service areas, skills, emergency contact, profile photo URL, and location-sharing preference.

### `PATCH /api/technician/profile`

All fields are optional, but at least one is required.

```json
{
  "name": "Ravi Kumar",
  "mobile": "9812345678",
  "emergencyContact": "9898989898",
  "profilePhotoUrl": "/uploads/photo.jpg",
  "locationSharing": true,
  "skills": ["LED repair", "installation"]
}
```

## Jobs

### `GET /api/technician/jobs`

Only jobs assigned to the authenticated technician are returned. Results are ordered with emergency jobs first.

Query parameters:

| Parameter | Example | Meaning |
|---|---|---|
| `filter` | `upcoming` | Mobile list filter: `today`, `upcoming`, `pending`, or `completed` |
| `status` | `work_in_progress` | Exact workflow status |
| `priority` | `emergency` | Exact priority |
| `from` | `2026-08-01` | Scheduled on/after date |
| `to` | `2026-08-31` | Scheduled on/before date |
| `today` | `true` | Today's scheduled jobs |
| `emergency` | `true` | Emergency jobs only |
| `page` | `1` | Page, default 1 |
| `limit` | `20` | Page size, maximum 100 |

Response includes `items` and `pagination`. Each item includes `jobId`, customer contact, `jobType`, location, priority, status, scheduled date/time, and progress percentage. The existing `id`, `ticketNo`, `category`, and `serviceType` fields remain available for backward compatibility.

Mobile filters:

- Today: `filter=today`.
- Upcoming: `filter=upcoming` (scheduled from tomorrow onward and not completed/closed).
- Pending: `filter=pending` (assigned or accepted).
- Completed: `filter=completed` (completed or closed).
- Priority: add `priority=emergency`, or any configured priority, to one of the filters above.

Advanced exact-status filters:

- In progress: `on_the_way`, `reached_location`, `inspection_started`, or `work_in_progress`.
- Completed work awaiting verification: `completed`.
- Closed jobs: `closed`.

### `GET /api/technician/jobs/:jobId`

Returns the full job: customer name/phone, address and GPS coordinates, sign-board photos, problem description, service type, admin instructions, priority, schedule, evidence, materials, status history, asset details, and previous service history when the ticket is linked to an asset. Mobile-friendly aliases include `phone`, `address`, and `gpsLocation`. Previous history is returned only through an assigned job linked to the same asset. A technician cannot access another technician's job.

For navigation, read `data.location.latitude` and `data.location.longitude` and open the device maps application. For calls, use `data.customerPhone`. The backend intentionally returns data and does not initiate device actions.

## Status workflow

### `PATCH /api/technician/jobs/:jobId/status`

```json
{ "status": "accepted", "notes": "Accepted from mobile app" }
```

Transitions are strictly sequential:

```text
assigned -> accepted -> on_the_way -> reached_location
         -> inspection_started -> work_in_progress -> completed
         -> customer verification -> closed
```

UI label mapping:

| UI action | API status |
|---|---|
| Accept Job | `accepted` |
| Start Travel | `on_the_way` |
| Reached Location | `reached_location` |
| Start Inspection | `inspection_started` |
| Start Work | `work_in_progress` |
| Complete Work | `completed` |

Changing status to `on_the_way` queues exactly one WhatsApp message for that job. Provider failures never roll back the status update. Admins can inspect delivery results at `GET /api/admin/whatsapp-notifications`.

At least one `before` photo and one `after` photo must exist before `completed` is accepted. Repeated, skipped, or backward transitions return `409`.

## Evidence and materials

### `POST /api/technician/jobs/:jobId/evidence`

Send multipart form data:

- `photos`: one to ten image files, each up to 8 MB
- `type`: `before`, `work`, or `after` (`damage` remains accepted for older clients and is stored as a before photo)
- `category`: optional classification:
  - Before: `existing_condition`, `damage`, or `problem`
  - Work: `work_in_progress`
  - After: `completed_work`
- `serviceNotes`: optional
- `workDescription`: optional
- `additionalRemarks`: optional

Photos require `type`. Notes can be submitted without photos or `type` using the same endpoint. Parts and materials use the separate materials endpoint below.

Allowed formats: JPEG, PNG, WebP, HEIC, and HEIF. Call the endpoint more than once for different photo types. Returned photo URLs are relative to the API host.

Example with cURL:

```bash
curl -X POST "$BASE_URL/api/technician/jobs/12/evidence" \
  -H "Authorization: Bearer $TOKEN" \
  -F "type=before" \
  -F "serviceNotes=Loose wiring found" \
  -F "photos=@before.jpg"
```

### `POST /api/technician/jobs/:jobId/materials`

```json
{ "name": "LED module", "quantity": 4, "unit": "pieces", "notes": "12V white" }
```

Materials cannot be added after work is completed or closed.

## Active location sharing

First enable `locationSharing` through the profile endpoint. While a job is active (`accepted` through `work_in_progress`), send:

### `POST /api/technician/jobs/:jobId/location`

```json
{ "latitude": 12.9715987, "longitude": 77.594566, "accuracyMeters": 8.5 }
```

The app decides the update frequency and must comply with device permission and privacy requirements. The API rejects updates when sharing is disabled or the job is inactive.

## Customer verification and closure

After status becomes `completed`, use either OTP or signature verification.

### OTP flow

1. `POST /api/technician/jobs/:jobId/completion-otp`
2. Deliver the OTP to the customer through the configured notification provider. In non-production environments, the response contains `developmentOtp`; production never returns it.
3. Confirm using the endpoint below.

### `POST /api/technician/jobs/:jobId/confirm`

OTP example:

```json
{ "otp": "123456", "accepted": true, "customerName": "Asha Rao", "remarks": "Work checked" }
```

Signature example:

```json
{ "signatureUrl": "/uploads/signature.png", "accepted": true, "customerName": "Asha Rao" }
```

The customer must explicitly accept, and an OTP or signature is mandatory. Successful confirmation changes both job and service ticket to `closed` and stores the confirmation audit data.

## Database setup

Run the schema and seed before starting the API:

```powershell
npm run server
```

The deployment process should execute `database/schema.sql` (or `node server/migrate.js`) before the new server version receives traffic. The schema changes are additive and safe to rerun. Upload files currently use local disk; production deployments should mount persistent storage or replace the storage adapter with object storage.

## Mobile integration checklist

- Store the JWT securely and attach it to every request.
- On `401`, clear the session and return to login.
- Use server-returned status as the source of truth; do not optimistically skip states.
- Compress large photos before upload and show per-file progress.
- Queue evidence/location requests when offline and retry with care.
- Never log OTPs, JWTs, signatures, phone numbers, or precise locations.
- Treat `409` as a refresh signal because the job state changed.
- Refresh job details after every mutation.
