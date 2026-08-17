# SignFix folder structure

The frontend is separated by user role so files are easy to find.

```text
src/
├── pages/
│   ├── admin/          Admin web-panel screens
│   ├── customer/       Customer screens
│   ├── technician/     Technician screens
│   ├── auth/           Authentication screens
│   └── shared/         Screens reused by roles
├── router/
│   ├── admin/          Admin routes
│   ├── customer/       Customer routes
│   ├── technician/     Technician routes
│   └── AppRouter.jsx   Authentication and role switch
├── components/         Shared layouts and UI
├── api/                REST API client
├── context/            Shared React state
└── hooks/              Shared hooks

server/
├── routes/             Endpoints by business domain
├── controllers/        HTTP handling
├── services/           Business workflows
├── repositories/       Database access
├── validation/         Request schemas and tests
├── middleware/         Auth, permissions, uploads, errors
├── utils/              Shared helpers
└── config/             Environment configuration

database/
├── schema.sql          PostgreSQL schema
└── seed.sql            Development data
```

## Where to add files

- Admin screen: `src/pages/admin/<Feature>Page.jsx`
- Customer screen: `src/pages/customer/<Feature>Page.jsx`
- Technician screen: `src/pages/technician/<Feature>Page.jsx`
- Role route: `src/router/<role>/<Role>Router.jsx`
- Shared UI: `src/components/ui/`
- Backend endpoint: matching domain files in `server/routes`, `server/controllers`, and `server/services`

Shared backend workflows such as orders and services remain domain-based because all three roles use the same records and business rules.
