# Service Area and WhatsApp APIs

All endpoints require `Authorization: Bearer <token>`.

## Admin service areas

Allowed roles: `super_admin`, `admin`, `service_manager`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/service-areas` | List configured cities |
| POST | `/api/admin/service-areas` | Add a city |
| PATCH | `/api/admin/service-areas/:id` | Edit or enable/disable a city |
| DELETE | `/api/admin/service-areas/:id` | Delete a city |

Fields are `name`, `state`, `country`, `latitude`, `longitude`, `radiusKm`, and `active`. Coordinates define the city center and the radius defines the permitted service boundary.

## WhatsApp logs and configuration

`GET /api/admin/whatsapp-notifications?limit=50` returns delivery status (`pending`, `sent`, `failed`, or `skipped`), provider ID, error, message, request, and timestamps.

```env
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
WHATSAPP_API_VERSION=v23.0
SERVICE_AREA_TOKEN_MINUTES=30
```

If WhatsApp is not configured, the job update still succeeds and its log is marked `skipped`. The database uniqueness constraint on job and event prevents duplicates.
