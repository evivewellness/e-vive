# E-Vive Platform — Technical Documentation

**This file has moved. See [README.md](README.md).**

`DOCUMENTATION.md` was a copy of the platform documentation taken in May 2026.
It fell behind, and by August it described an authentication model that no
longer exists — localStorage sessions, browser-side password comparison, a
SHA-256 admin hash in the client bundle. All three have been removed, and
following the old text would have been actively misleading. The same applies to
everything it said about data access: the browser no longer holds a database
key at all.

There is one document now: **[README.md](README.md)**. It covers the same ground
and is kept current.

| Looking for | See |
|---|---|
| What is done, what is outstanding | [Implementation Status](README.md#implementation-status--august-2026) |
| Tech stack, environment variables, API routes | [§2](README.md#2-tech-stack--architecture) |
| Route map | [§3](README.md#3-route-map) |
| Public pages, client / HCA / admin portals | [§4](README.md#4-public-pages)–[§7](README.md#7-admin-portal) |
| Shared components | [§8](README.md#8-shared-components) |
| Tables, schemas, store functions, migrations | [§9](README.md#9-data-layer--supabase-reference) |
| **How data access is authorised** | [§9.6 The Data Gateway](README.md#96-the-data-gateway) |
| Admin permissions | [§12 RBAC System](README.md#12-rbac-system) |
| Authentication | [§10](README.md#10-authentication-systems) |
| Security configuration and known limitations | [§14](README.md#14-security-configuration) |
| Running, deploying, adding a table, creating an admin | [§17](README.md#17-development-guide) |
