# SignFix Quotation API

All URLs below are relative to the deployment host, for example `https://signfix-2.onrender.com`. JSON requests use `Content-Type: application/json`. Protected calls require `Authorization: Bearer <JWT>`.

The importable Postman collection is `postman/SignFix-Customer-Quotation.postman_collection.json`. Its default demo login is `customer@signfix.in` / `SignFix@123`; change collection variables when demo credentials are disabled.

## Customer APIs

Customer quotation routes require a customer JWT and the matching `quotation.*_own` permission. Every query verifies the authenticated user through the quotation's customer relationship. A missing quotation and another customer's quotation both return `404`.

| Method | Route | Permission | Purpose |
|---|---|---|---|
| GET | `/api/customer/quotations?page=1&pageSize=20&status=sent` | `quotation.view_own` | Paginated list of owned, customer-visible quotations |
| GET | `/api/customer/quotations/:quotationNo` | `quotation.view_own` | Safe quotation detail; first read moves `sent` to `viewed` |
| POST | `/api/customer/quotations/:quotationNo/approve` | `quotation.approve_own` | Approve a valid `sent`/`viewed` quotation |
| POST | `/api/customer/quotations/:quotationNo/request-changes` | `quotation.request_changes_own` | Submit a required change comment |
| POST | `/api/customer/quotations/:quotationNo/reject` | `quotation.reject_own` | Reject with a required reason |
| GET | `/api/customer/quotations/:quotationNo/pdf` | `quotation.download_own` | Download the authoritative, customer-safe PDF |

Supported list filters are `sent`, `viewed`, `change_requested`, `approved`, `rejected`, `expired`, and `cancelled`. `pageSize` is constrained to 5–50. Draft quotations are never returned.

### Login

```http
POST /api/auth/login
```

```json
{
  "email": "customer@signfix.in",
  "password": "SignFix@123",
  "portal": "customer"
}
```

Copy the returned `token` into `Authorization: Bearer <token>`.

### Approve dummy body

```json
{
  "comment": "Approved. Please proceed with production planning."
}
```

Approval is transactional and idempotent. Repeating an already successful approval returns `idempotent: true`. Approval is blocked after expiry, cancellation, rejection, or a change request. If the related order is still in the existing `quotation` state, it moves to the existing `approved` state.

### Request changes dummy body

```json
{
  "comment": "Please change the sign size to 10 ft x 4 ft and revise the installation charge."
}
```

The trimmed comment is required and limited to 2,000 characters. The new state is `change_requested`; Admin must create a new version before sending an update.

### Reject dummy body

```json
{
  "reason": "The commercial amount is outside our approved budget."
}
```

The trimmed reason is required and limited to 2,000 characters. Repeating the same terminal rejection is safe and returns `idempotent: true`.

### Customer-safe detail

Detail includes customer/order identity, items, stored financial breakdown, terms, customer notes, safe status history, availability metadata, and configured payment capability. It never contains internal notes, administrative discussion, raw audit logs, admin identity details, credentials, or storage paths. The PDF follows the same privacy boundary.

## Admin APIs

| Method | Route | Permission |
|---|---|---|
| GET | `/api/quotations/options` | `quotation.create` |
| GET | `/api/quotations?page=1&pageSize=20&status=pending&search=...` | `quotation.view` |
| GET | `/api/quotations/:quotationNo` | `quotation.view` |
| POST | `/api/quotations` | `quotation.create` |
| PATCH | `/api/quotations/:quotationNo` | `quotation.edit` |
| POST | `/api/quotations/:quotationNo/revisions` | `quotation.manage_revisions` |
| POST | `/api/quotations/:quotationNo/send` | `quotation.send` |
| POST | `/api/quotations/:quotationNo/resend` | `quotation.send` |
| POST | `/api/quotations/:quotationNo/cancel` | `quotation.cancel` |
| GET | `/api/quotations/:quotationNo/pdf` | `quotation.download` |

Mutations after creation use `expectedLockVersion` from the latest detail response. A stale mutation returns `409 STALE_QUOTATION`. Submitted `subtotal`, `discountAmount`, `gstAmount`, `lineTotal`, `finalAmount`, quotation number, version, and status are ignored/stripped; the server generates or calculates them.

## Status and errors

Lifecycle states are `draft`, `sent`, `viewed`, `change_requested`, `approved`, `rejected`, `expired`, and `cancelled`. The service enforces legal transitions under row locks. Expiry is enforced before list/detail/action operations, with status history, audit events, and guarded one-day reminders.

Common responses:

| HTTP | Error code | Meaning |
|---|---|---|
| 401 | — | Missing, invalid, expired, or revoked JWT |
| 403 | `PERMISSION_DENIED` | Role lacks the required permission |
| 404 | `QUOTATION_NOT_FOUND` | Missing quotation or customer does not own it |
| 409 | `QUOTATION_STATE_CONFLICT` | Action is not valid in the current state |
| 409 | `QUOTATION_EXPIRED` | Customer attempted a decision after validity |
| 409 | `STALE_QUOTATION` | Optimistic lock version is stale |
| 422 | `REQUEST_FAILED` | Body, pricing, validity, or discount validation failed |

```json
{
  "success": false,
  "message": "Quotation cannot be approved in its current state",
  "error": "Quotation cannot be approved in its current state",
  "errorCode": "QUOTATION_STATE_CONFLICT"
}
```

## Postman test order

1. Import the collection and choose `baseUrl`: `https://signfix.me`, `https://signfix-2.vercel.app`, or `https://signfix-2.onrender.com`.
2. If no sent quotation exists, run **0 - Optional Admin Setup**. It selects an existing order, creates a real draft with dummy line items, and sends it.
3. Run **Customer Login**, then the read APIs.
4. Set collection variable `decisionToTest` to `approve`, `request_changes`, or `reject`, then run the decisions folder. Non-selected mutations are skipped automatically.
5. To test another decision, create a different quotation or create/send an Admin revision after a change request.

The setup payload deliberately includes fake client totals (`subtotal`, `gstAmount`, `finalAmount` equal to `1`) so the response can confirm that authoritative server totals replace them.
