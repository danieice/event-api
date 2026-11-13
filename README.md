# Event Management API

REST API for an event platform: users create accounts, publish events, and register to attend. Built with NestJS, TypeScript, PostgreSQL (Supabase) and TypeORM, deployed on Render.

- **API base URL:** https://event-api-ss2i.onrender.com/api
- **Swagger docs:** https://event-api-ss2i.onrender.com/docs
- **Health check:** https://event-api-ss2i.onrender.com/api/health

> Hosted on Render's free tier, which sleeps after 15 minutes of inactivity. The first request after that can take up to a minute.

## Tech stack

NestJS 12, TypeScript, PostgreSQL on Supabase, TypeORM 1.x with migrations, Passport JWT, bcryptjs, class-validator, Joi, Swagger (OpenAPI), `@nestjs/throttler`, Render.

## Features

- Account registration and login with JWT authentication
- Event CRUD; only the owner can update or delete an event
- Paginated event listing with search and an "upcoming only" filter
- Event registration and cancellation, with duplicate and capacity protection that holds under concurrent requests
- A list of the events each user is registered for
- Rate limiting on login and register
- Consistent error responses and a database-aware health check

## Running locally

**Prerequisites:** Node.js 22, pnpm 12, and a PostgreSQL database (a free Supabase project works).

```bash
git clone https://github.com/danieice/event-api.git
cd event-api
pnpm install
cp .env.example .env    # then fill in the values
pnpm migration:run
pnpm start:dev
```

The API runs on http://localhost:3000/api and Swagger on http://localhost:3000/docs.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret used to sign tokens, at least 32 characters |
| `JWT_EXPIRES_IN` | No | Token lifetime, default `1d` |
| `PORT` | No | Port to listen on, default `3000` |
| `NODE_ENV` | No | `development`, `production` or `test` |

All variables are validated at startup. The app refuses to boot if any are missing or malformed.

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Database setup

1. Create a Supabase project.
2. Open **Connect → Direct → Session pooler** and copy the URI into `DATABASE_URL`.
3. Run `pnpm migration:run`.

The session pooler is used because Supabase's direct connection is IPv6-only on free projects, while Render only supports IPv4 outbound.

**Schema**

| Table | Purpose | Key constraints |
|---|---|---|
| `users` | Accounts | Unique email; password stored as a bcrypt hash |
| `events` | Events and their owner | `ends_at > starts_at`, `capacity > 0`, cascades on owner deletion |
| `registrations` | Who is attending what | Unique `(user_id, event_id)`, cascades on event or user deletion |

**Migration commands**

```bash
pnpm migration:generate src/database/migrations/SomeName   # create from entity changes
pnpm migration:run                                         # apply pending migrations
pnpm migration:revert                                      # undo the last migration
```

Schema changes only happen through migrations; `synchronize` is disabled.

## Using the API

Every endpoint except register, login and health requires a token: `Authorization: Bearer <token>`.

**In Swagger:** run `POST /auth/login`, copy the `accessToken`, click **Authorize**, paste the token (without `Bearer`), and every protected endpoint becomes callable.

### Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create an account |
| POST | `/api/auth/login` | Log in and receive a token |
| GET | `/api/auth/me` | Current user's profile |
| POST | `/api/events` | Create an event |
| GET | `/api/events` | List events (`page`, `limit`, `upcoming`, `search`) |
| GET | `/api/events/mine` | Events created by the current user |
| GET | `/api/events/:id` | Event details, including spots left |
| PATCH | `/api/events/:id` | Update an event (owner only) |
| DELETE | `/api/events/:id` | Delete an event (owner only) |
| POST | `/api/events/:eventId/registrations` | Register for an event |
| DELETE | `/api/events/:eventId/registrations/me` | Cancel your registration |
| GET | `/api/registrations/me` | Events you're registered for |
| GET | `/api/health` | API and database status |

### Example

```bash
BASE=https://event-api-ss2i.onrender.com/api

curl -X POST $BASE/auth/register -H 'Content-Type: application/json' \
  -d '{"email":"you@example.com","fullName":"Your Name","password":"a-strong-password"}'

curl -X POST $BASE/events -H 'Content-Type: application/json' \
  -H "Authorization: Bearer <token>" \
  -d '{"title":"Tech Meetup","description":"Talks and networking","location":"Douala",
       "startsAt":"2026-12-10T17:00:00Z","endsAt":"2026-12-10T20:00:00Z","capacity":50}'
```

### Errors

Every error uses the same shape:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "This event is full",
  "path": "/api/events/<id>/registrations",
  "timestamp": "2026-11-13T11:05:45.669Z"
}
```

| Status | Meaning |
|---|---|
| 400 | Invalid input, malformed id, or an event that has already started |
| 401 | Missing, invalid or expired token, or wrong credentials |
| 403 | Trying to modify someone else's event |
| 404 | Resource not found |
| 409 | Email already registered, already registered for the event, event full, or capacity below current registrations |
| 429 | Too many login or register attempts |

## Security

- Passwords hashed with bcrypt (cost 12); the hash is excluded from every query except login and never returned
- Every route requires a JWT by default; only register, login and health are marked public
- Login failures return the same message and take the same time whether or not the email exists
- Unknown request fields are rejected, so clients can't set fields like `ownerId`
- Login and register are limited to 5 attempts per minute per IP
- Unexpected errors are logged server-side and return a generic message to the client

## How capacity is enforced

Registering runs inside a database transaction that first takes a row lock on the event (`SELECT ... FOR UPDATE`). Concurrent registrations for the same event wait their turn, so the seat count is always checked against up-to-date data. Duplicate registrations are additionally blocked by a unique constraint on `(user_id, event_id)`.

Tested by sending five simultaneous registrations to an event with two seats: exactly two succeeded and three were rejected with `409`.

## Deployment (Render)

| Setting | Value |
|---|---|
| Build command | `npx --yes pnpm@12.18.0 install --frozen-lockfile && npx --yes pnpm@12.18.0 build` |
| Start command | `node node_modules/typeorm/cli.js migration:run -d dist/database/data-source.js && NODE_ENV=production node dist/main` |
| Health check path | `/api/health` |
| Environment | `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` |

Pending migrations run automatically on every deploy before the app starts. `NODE_ENV` is set in the start command rather than as an environment variable, because setting it during install would skip the dev dependencies the build needs.

## Project structure

```
src/
  main.ts                 bootstrap: validation, error filter, Swagger, CORS
  app.module.ts
  config/                 env validation and shared database options
  database/               CLI data source and migrations
  common/                 decorators, DTOs, error filter, shared types and utils
  modules/
    auth/                 register, login, JWT strategy and guard
    users/                user entity and service
    events/               event CRUD and ownership rules
    registrations/        registration, cancellation, capacity locking
    health/               health check
```
