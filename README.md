# VoyageCraft - Production Travel Planning & Collaboration Platform

VoyageCraft is a feature-rich, production-ready travel planning and collaboration platform built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **Prisma ORM**, and **Cloud PostgreSQL**.

The application is architected specifically for Vercel deployment with serverless execution, secret API security, role-based authorization, responsive UI, real-time-like notifications, scheduled reminder jobs, and budget analytics charts.

---

## 1. Project Overview
VoyageCraft enables travelers and groups to:
- Register & authenticate securely with JWT sessions & bcrypt password hashing.
- Manage trips (Upcoming, Active, Completed) with full itinerary & activity planning.
- Set budget limits and track monetary expenses with **PostgreSQL Decimal** precision.
- Receive automatic **80% and 100% budget threshold alerts**.
- Collaborate with travel partners via role-based access control (`TRIP_OWNER`, `GROUP_ADMIN`, `MEMBER`) and join requests.
- Discover destinations with live weather forecasts and attraction listings.
- Admin governance dashboard for user analytics, trip metrics, and destination publishing.
- Vercel Cron compatible scheduled jobs for daily upcoming trip & activity reminders.

---

## 2. Technology Stack
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Database & ORM**: PostgreSQL, Prisma ORM
- **Authentication**: Custom JWT Session cookies, bcryptjs
- **Charts & Data Viz**: Recharts (Dynamic category expenditure breakdown)
- **External Services**: OpenWeatherMap / WeatherAPI (via server route `/api/weather`), Google Places Search (via server route `/api/destinations/search`), Nodemailer SMTP
- **Scheduled Reminders**: Vercel Cron (`/api/cron/reminders`)

---

## 3. Architecture
VoyageCraft follows a strict server-side API architecture suitable for serverless cloud deployment:

```
[ Browser / Client UI ] 
        │
        ▼ (Relative API Calls: /api/*)
[ Vercel Next.js App Router (Serverless Functions) ]
        │
        ├───────────────────────┼────────────────────────┐
        ▼                       ▼                        ▼
[ Prisma ORM ]      [ Secret External APIs ]   [ Vercel Cron Jobs ]
        │            (Weather, Places, Email)            │
        ▼                       │                        │
[ Cloud PostgreSQL ] ◄──────────┴────────────────────────┘
(Neon / Supabase / Vercel Postgres)
```

> [!IMPORTANT]
> **Zero Localhost in Production**:
> All client requests use relative paths (`/api/...`). Secrets (Weather API Key, Google Places Key, JWT Secret, Database Password, SMTP Password) are kept strictly server-side in Vercel environment variables and are never exposed to browser code.

---

## 4. Database Setup

VoyageCraft uses **PostgreSQL** with Prisma ORM.

### Cloud PostgreSQL Providers Supported:
- **Neon**: `postgresql://user:pass@ep-xyz.us-east-1.aws.neon.tech/voyagecraft?sslmode=require`
- **Supabase**: `postgresql://postgres:pass@db.xyz.supabase.co:5432/postgres`
- **Vercel Postgres**: Standard connection string provided in Vercel project settings.

### Schema Migration & Seeding:
```bash
# Push Prisma schema to your PostgreSQL database
npx prisma db push

# Generate Prisma Client
npx prisma generate

# Seed initial admin user & curated destinations
npx prisma db seed
```

---

## 5. Environment Variables

Create a `.env` file in the project root based on `.env.example`:

```env
# Cloud PostgreSQL Database URL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/voyagecraft?schema=public"

# Session & JWT Authentication Secret
JWT_SECRET="your-super-secret-jwt-key-32-chars-minimum"

# Server-Side External API Keys (Optional, fallback logic provided when unconfigured)
WEATHER_API_KEY=""
GOOGLE_PLACES_API_KEY=""

# SMTP Email Notification Credentials (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="notifications@voyagecraft.com"
SMTP_PASS="your-app-password"

# Vercel Cron Secret
CRON_SECRET="voyagecraft-cron-secret-key"
```

---

## 6. Local Development

```bash
# Install dependencies
npm install

# Run database setup
npx prisma db push

# Start Next.js development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## 7. Prisma Commands

- **Update Database Schema**: `npx prisma db push`
- **Generate Prisma Client**: `npx prisma generate`
- **Open Prisma Studio**: `npx prisma studio`

---

## 8. Production Build

To verify compilation and type checks locally before pushing to Vercel:

```bash
npm run build
```

This executes `prisma generate && next build`.

---

## 9. Vercel Deployment

1. Push your repository to **GitHub** / **GitLab** / **Bitbucket**.
2. Import project into **Vercel**.
3. In Vercel Project Settings -> **Environment Variables**, add:
   - `DATABASE_URL` (Your Neon / Supabase connection string)
   - `JWT_SECRET` (A strong random string)
   - `WEATHER_API_KEY` (Optional)
   - `GOOGLE_PLACES_API_KEY` (Optional)
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (Optional)
   - `CRON_SECRET` (Optional)
4. Click **Deploy**. Vercel will automatically run `npm run build` and launch serverless functions.

---

## 10. External API Configuration

- **Weather API**: OpenWeatherMap API key can be set in `WEATHER_API_KEY`. If left empty, the server route `/api/weather` provides realistic simulated weather forecasts so the app functions seamlessly out-of-the-box.
- **Places Search**: Google Places API key can be set in `GOOGLE_PLACES_API_KEY`. Requests are proxied through `/api/destinations/search`.

---

## 11. Scheduled Jobs (Reminders & Alerts)

VoyageCraft uses **Vercel Cron** (`vercel.json`):
```json
{
  "crons": [
    {
      "path": "/api/cron/reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```
This endpoint finds upcoming trips starting within 7 days and activities starting in 24 hours, sending notifications while avoiding duplicate alerts. No local computer background process required!

---

## 12. Authentication & Roles

- **USER Role**: Can register, login, create/manage trips, add itinerary/activities, track expenses, save favourite destinations, invite members, and join public trips.
- **ADMIN Role**: Access to `/admin` dashboard, user analytics, trip metrics, platform expense totals, and ability to publish destinations & attractions.
- **Default Credentials (after seed)**:
  - Admin: `admin@voyagecraft.com` / `admin123`
  - Traveler: `traveler@voyagecraft.com` / `user1234`

---

## 13. Troubleshooting

- **Prisma Client Missing Error**: Run `npx prisma generate`.
- **Database Connection Failure**: Verify `DATABASE_URL` includes `?sslmode=require` if using Neon or Supabase cloud postgres.
- **403 Admin Access Error**: Ensure your logged-in user account has `role: "ADMIN"` in PostgreSQL.

---

## Does this application require localhost after deployment?

**NO.**
Once deployed to Vercel and connected to a Cloud PostgreSQL instance (Neon, Supabase, or Vercel Postgres), VoyageCraft is completely self-contained and accessible from any device (laptop, Android, iPhone, tablet) without requiring your local computer to be running.
