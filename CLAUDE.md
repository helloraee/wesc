# CLAUDE.md — West End Sports Club Platform

> This file is the single source of truth for Claude Code when building the West End Sports Club web application. Read this entire file before writing any code. All decisions documented here are final unless explicitly overridden by the user in conversation.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Club** | West End Sports Club |
| **Founded** | 2024 |
| **Location** | Malé, Maldives |
| **Mascot** | Wolf (geometric crest) |
| **Brand colours** | Royal blue `#2B3A8F` (primary) · White `#FFFFFF` (contrast) |
| **Brand ramp** | Single-hue blue scale — see Section 4 |
| **Logo file** | `public/assets/WEST_Logo.png` |

---

## 2. Platform Overview & Phases

### Phase 1 — Back-office ops + holding page (build first)
- Modular back-office CMS: team management, athlete management, training planning, attendance system, event/fixture ops
- Authentication & RBAC (role-based access control)
- Public-facing holding page: "The Pack Is Getting Ready." with email capture
- **No public site content yet** — all public routes except `/` show holding page

### Phase 2 — Full public website + member portal + store (build after Phase 1 is stable)
- Full public website (all sitemap pages)
- Member portal (member dashboard, renewal, profile)
- Store CMS (merchandise, orders)
- Blog / News CMS
- SEO layer (next/metadata, OG tags, sitemap.xml, robots.txt)
- Working contact form + notification channels

---

## 3. Tech Stack — Locked, Do Not Change

| Layer | Technology | Notes |
|---|---|---|
| **Framework** | Next.js 14 (App Router) | `src/` directory structure |
| **Language** | TypeScript | strict mode on |
| **UI components** | shadcn/ui (Radix primitives) | customised with brand tokens |
| **Animations** | Framer Motion | all page transitions, staggered reveals, hover states |
| **Auth** | NextAuth.js v5 | credentials + future OAuth |
| **Database** | PostgreSQL | DO Managed Database |
| **ORM** | Prisma | schema-first, migrations committed to repo |
| **Cache / Sessions** | Redis OSS (self-hosted on DO Droplet) | `ioredis` client |
| **Email** | Resend | transactional + notification emails |
| **Hosting** | DigitalOcean App Platform | auto-deploy from GitHub `main` |
| **DNS / CDN / WAF** | Cloudflare | proxied, WAF rules enabled |
| **Version control** | GitHub | `main` = production, `develop` = staging |
| **PWA** | `next-pwa` (Workbox) | service worker, offline support, installable |

### Runtime environment variables (`.env.local` / DO App Platform env)
```
DATABASE_URL=
REDIS_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=
```

---

## 4. Brand Design System

### Colour tokens — define in `src/styles/globals.css` as CSS variables

```css
:root {
  /* Primary blue ramp — from logo */
  --w-900: #0D1640;
  --w-800: #162060;
  --w-700: #1E2E80;
  --w-600: #2B3A8F;   /* PRIMARY BRAND COLOUR */
  --w-500: #3D4FA3;
  --w-400: #5A6BBF;
  --w-300: #8F9DD4;
  --w-200: #C4CBE8;
  --w-100: #E4E8F5;
  --w-50:  #F2F4FB;
  --w-white: #FFFFFF;

  /* Semantic — map to shadcn expected vars */
  --background: var(--w-white);
  --foreground: var(--w-900);
  --primary: var(--w-600);
  --primary-foreground: var(--w-white);
  --secondary: var(--w-50);
  --secondary-foreground: var(--w-700);
  --muted: var(--w-100);
  --muted-foreground: var(--w-400);
  --border: var(--w-200);
  --ring: var(--w-400);
  --card: var(--w-white);
  --card-foreground: var(--w-900);
}
```

### Typography
- **Display / headings**: `Barlow Condensed` (Google Fonts) — bold, athletic, echoes the crest lettering
- **Body / UI**: `DM Sans` (Google Fonts) — clean, modern, readable at small sizes
- **Mono / code**: `JetBrains Mono` — for data tables and code blocks in admin
- Import via `next/font/google` in `src/app/layout.tsx`

### Spacing & radius
- Use Tailwind default spacing scale
- Border radius: `rounded-md` (6px) for inputs/buttons, `rounded-lg` (10px) for cards, `rounded-xl` (14px) for hero panels
- Card border: `border border-w-200` (0.5px in shadcn context → `border`)

### Motion conventions (Framer Motion)
- Page entry: `opacity 0→1, y 16→0, duration 0.35s, ease "easeOut"`
- Staggered lists: `staggerChildren: 0.06s`
- Hover cards: `scale 1→1.015, duration 0.18s`
- Sidebar items: `x -8→0, opacity 0→1` on mount
- Stat counters: count up animation on viewport entry using `useInView`
- Never animate layout-affecting properties (width, height) — only transform and opacity

### PWA
- Install prompt on mobile for coaches/managers
- Service worker caches: shell, static assets, API GET responses (attendance reads, fixture reads)
- Offline fallback page: `/offline` — branded, explains limited connectivity
- `manifest.json`: name "West End SC", short_name "WESC", theme_color `#162060`, background_color `#0D1640`
- Icons: generate from `WEST_Logo.png` at 192×192 and 512×512

---

## 5. Directory Structure

```
src/
├── app/
│   ├── (public)/               # Public-facing routes (Phase 2 — holding page only in Phase 1)
│   │   ├── page.tsx            # Holding page (Phase 1) → Homepage (Phase 2)
│   │   ├── about/
│   │   ├── teams/
│   │   ├── fixtures/
│   │   ├── news/
│   │   ├── membership/
│   │   ├── events/
│   │   ├── contact/
│   │   └── sponsors/
│   ├── (auth)/                 # Auth routes — no nav shell
│   │   ├── login/
│   │   └── forgot-password/
│   ├── (back-office)/          # Protected — requires auth
│   │   ├── layout.tsx          # Sidebar layout with role-aware nav
│   │   ├── dashboard/
│   │   ├── athletes/
│   │   │   ├── page.tsx        # Athlete list
│   │   │   ├── [id]/page.tsx   # Athlete profile
│   │   │   └── new/page.tsx    # Add athlete form
│   │   ├── teams/
│   │   │   ├── page.tsx        # Team list
│   │   │   ├── [id]/page.tsx   # Team detail + roster
│   │   │   └── new/page.tsx
│   │   ├── attendance/
│   │   │   ├── page.tsx        # Attendance overview + analytics
│   │   │   ├── sessions/
│   │   │   │   ├── page.tsx    # Session list
│   │   │   │   ├── [id]/page.tsx   # Session detail + mark attendance
│   │   │   │   └── new/page.tsx    # Schedule session(s)
│   │   │   └── reports/page.tsx
│   │   ├── training/
│   │   │   ├── page.tsx        # Training calendar
│   │   │   └── [id]/page.tsx
│   │   ├── fixtures/
│   │   ├── events/
│   │   ├── notifications/      # Notification manager
│   │   ├── sports/             # Admin only — manage sports list
│   │   ├── users/              # Admin only — manage users/roles
│   │   └── settings/
│   └── api/
│       ├── auth/[...nextauth]/
│       ├── athletes/
│       ├── teams/
│       ├── sports/
│       ├── sessions/
│       ├── attendance/
│       ├── notifications/
│       └── webhooks/
├── components/
│   ├── ui/                     # shadcn auto-generated — do not hand-edit
│   ├── layout/
│   │   ├── Navbar.tsx          # Public nav
│   │   ├── BackOfficeSidebar.tsx
│   │   ├── BackOfficeHeader.tsx
│   │   └── Footer.tsx
│   ├── attendance/
│   │   ├── AttendanceSheet.tsx
│   │   ├── AttendanceStats.tsx
│   │   ├── SessionScheduler.tsx
│   │   └── AbsenceReasonModal.tsx
│   ├── athletes/
│   │   ├── AthleteCard.tsx
│   │   ├── AthleteForm.tsx
│   │   └── AthleteTable.tsx
│   ├── teams/
│   │   ├── TeamCard.tsx
│   │   └── RosterBuilder.tsx
│   ├── notifications/
│   │   └── NotificationManager.tsx
│   └── shared/
│       ├── PageHeader.tsx
│       ├── StatCard.tsx
│       ├── DataTable.tsx       # shadcn Table + TanStack Table
│       ├── ConfirmDialog.tsx
│       └── EmptyState.tsx
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── redis.ts                # ioredis client singleton
│   ├── auth.ts                 # NextAuth config
│   ├── resend.ts               # Resend client + email templates
│   ├── utils.ts                # cn(), formatDate(), etc.
│   └── constants.ts
├── hooks/
│   ├── useAttendance.ts
│   ├── useSession.ts
│   └── useNotifications.ts
├── types/
│   └── index.ts                # Shared TypeScript types (mirrors Prisma models)
└── styles/
    └── globals.css
```

---

## 6. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── AUTH & USERS ─────────────────────────────────────

model User {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  passwordHash  String
  role          Role      @default(COACH)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  managedTeams  Team[]    @relation("TeamManager")
  coachedTeams  Team[]    @relation("TeamCoach")
  attendanceLogs AttendanceLog[] @relation("MarkedBy")
  sessions      PracticeSession[] @relation("SessionCreatedBy")
  notifications NotificationPreference?
}

enum Role {
  SUPER_ADMIN
  ADMIN
  TEAM_MANAGER
  COACH
}

// ─── SPORTS ───────────────────────────────────────────

model Sport {
  id          String   @id @default(cuid())
  name        String   @unique   // e.g. "Handball", "Football", "Basketball 3x3"
  slug        String   @unique
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())

  teams       Team[]
  athletes    Athlete[]
}

// ─── TEAMS ────────────────────────────────────────────

model Team {
  id          String   @id @default(cuid())
  name        String               // e.g. "1st Division Women's Handball"
  sportId     String
  sport       Sport    @relation(fields: [sportId], references: [id])
  type        TeamType @default(PLAYING)
  gender      Gender?
  managerId   String?
  manager     User?    @relation("TeamManager", fields: [managerId], references: [id])
  coachId     String?
  coach       User?    @relation("TeamCoach", fields: [coachId], references: [id])
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // An athlete has ONE playing team per sport but can be in MULTIPLE practice teams
  playingAthletes  Athlete[]        @relation("PlayingTeam")
  practiceAthletes TeamPracticeAthlete[]
  sessions         PracticeSession[]
}

enum TeamType {
  PLAYING    // Official competition team
  PRACTICE   // Practice/training team
}

enum Gender {
  MALE
  FEMALE
  MIXED
}

// ─── ATHLETES ─────────────────────────────────────────

model Athlete {
  id              String   @id @default(cuid())
  fullName        String
  idCardNumber    String   @unique
  jerseyNumber    String?
  gender          Gender
  contactNumber   String?
  sportId         String
  sport           Sport    @relation(fields: [sportId], references: [id])

  // ONE playing team per athlete
  playingTeamId   String?
  playingTeam     Team?    @relation("PlayingTeam", fields: [playingTeamId], references: [id])

  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Multiple practice teams
  practiceTeams   TeamPracticeAthlete[]
  attendanceLogs  AttendanceLog[]
}

// Junction: athlete ↔ practice teams (many-to-many)
model TeamPracticeAthlete {
  athleteId   String
  teamId      String
  joinedAt    DateTime @default(now())
  athlete     Athlete  @relation(fields: [athleteId], references: [id], onDelete: Cascade)
  team        Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)

  @@id([athleteId, teamId])
}

// ─── PRACTICE SESSIONS ────────────────────────────────

model PracticeSession {
  id              String          @id @default(cuid())
  teamId          String
  team            Team            @relation(fields: [teamId], references: [id])
  title           String?         // Optional label e.g. "Pre-match drill"
  location        String
  scheduledAt     DateTime        // Date + time of THIS occurrence
  durationMinutes Int             @default(90)
  notes           String?
  status          SessionStatus   @default(SCHEDULED)

  // Recurrence — stored on the parent rule, not per-occurrence
  recurrenceRuleId String?
  recurrenceRule   RecurrenceRule? @relation(fields: [recurrenceRuleId], references: [id])

  createdById     String
  createdBy       User            @relation("SessionCreatedBy", fields: [createdById], references: [id])
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  attendanceLogs  AttendanceLog[]
  notifications   SessionNotification[]
}

enum SessionStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

// ─── RECURRENCE ───────────────────────────────────────

model RecurrenceRule {
  id              String            @id @default(cuid())
  frequency       RecurrenceFreq
  interval        Int               @default(1)   // every N days/weeks
  daysOfWeek      Int[]             // 0=Sun … 6=Sat (for WEEKLY)
  endsAt          DateTime?
  maxOccurrences  Int?
  createdAt       DateTime          @default(now())

  // Each generated occurrence is a PracticeSession linked here
  sessions        PracticeSession[]

  // Per-occurrence overrides (time/location edits like iPhone reminders)
  overrides       SessionOverride[]
}

enum RecurrenceFreq {
  DAILY
  WEEKLY
  CUSTOM
}

// Stores per-occurrence overrides (edit one in a recurring series)
model SessionOverride {
  id               String         @id @default(cuid())
  recurrenceRuleId String
  recurrenceRule   RecurrenceRule @relation(fields: [recurrenceRuleId], references: [id])
  originalDate     DateTime       // Which occurrence this overrides
  newScheduledAt   DateTime?
  newLocation      String?
  newDuration      Int?
  isCancelled      Boolean        @default(false)
  createdAt        DateTime       @default(now())
}

// ─── ATTENDANCE ───────────────────────────────────────

model AttendanceLog {
  id          String           @id @default(cuid())
  sessionId   String
  session     PracticeSession  @relation(fields: [sessionId], references: [id])
  athleteId   String
  athlete     Athlete          @relation(fields: [athleteId], references: [id])
  status      AttendanceStatus
  reason      String?          // Absence reason (free text)
  markedById  String
  markedBy    User             @relation("MarkedBy", fields: [markedById], references: [id])
  markedAt    DateTime         @default(now())
  updatedAt   DateTime         @updatedAt

  @@unique([sessionId, athleteId])  // One log per athlete per session
}

enum AttendanceStatus {
  PRESENT
  ABSENT
  LATE
  EXCUSED
}

// ─── NOTIFICATIONS ────────────────────────────────────

model NotificationPreference {
  id                  String   @id @default(cuid())
  userId              String   @unique
  user                User     @relation(fields: [userId], references: [id])
  emailEnabled        Boolean  @default(true)
  // Reminder timing in minutes before session
  reminderMinutes     Int[]    @default([1440, 60])  // 24hr + 1hr default
  updatedAt           DateTime @updatedAt
}

model SessionNotification {
  id          String              @id @default(cuid())
  sessionId   String
  session     PracticeSession     @relation(fields: [sessionId], references: [id])
  type        NotificationType
  scheduledAt DateTime
  sentAt      DateTime?
  status      NotifStatus         @default(PENDING)
  createdAt   DateTime            @default(now())
}

enum NotificationType {
  SESSION_REMINDER_24H
  SESSION_REMINDER_1H
  SESSION_CANCELLED
  SESSION_RESCHEDULED
  ATTENDANCE_REPORT
}

enum NotifStatus {
  PENDING
  SENT
  FAILED
}
```

---

## 7. Authentication & RBAC

### Roles and permissions matrix

| Action | SUPER_ADMIN | ADMIN | TEAM_MANAGER | COACH |
|---|:---:|:---:|:---:|:---:|
| Manage sports (create/edit/delete) | ✅ | ✅ | ❌ | ❌ |
| Manage all users | ✅ | ✅ | ❌ | ❌ |
| Manage all teams | ✅ | ✅ | own sport | ❌ |
| Create/edit teams | ✅ | ✅ | ✅ | ❌ |
| Add/edit athletes | ✅ | ✅ | ✅ | ✅ |
| Schedule sessions | ✅ | ✅ | ✅ | ✅ |
| Mark attendance | ✅ | ✅ | ✅ | ✅ |
| View all reports | ✅ | ✅ | own teams | own teams |
| Manage notifications | ✅ | ✅ | ✅ | own prefs |
| Access settings | ✅ | ✅ | ❌ | ❌ |

### Implementation
- Session stored in Redis via `ioredis` adapter for NextAuth
- Middleware at `src/middleware.ts` protects all `/back-office/*` routes
- Route-level permission checks via a `withRole(roles[])` wrapper utility
- All API routes validate session and role before any DB operation
- Passwords hashed with `bcryptjs` (12 rounds)

---

## 8. Attendance Module — Detailed Specification

This is the **critical Phase 1 module**. Build it first after auth scaffolding.

### 8.1 Athlete management
- Form fields: Full Name (required), ID Card Number (required, unique), Jersey Number (optional), Gender (Male/Female, required), Contact Number (optional)
- Assign to: Sport (required) → Playing Team (one per sport, optional at creation)
- Practice teams: assigned separately from the team/roster builder
- Search/filter: by name, ID card, sport, team, gender, active status
- Bulk import: CSV upload (columns: fullName, idCardNumber, jerseyNumber, gender, contactNumber, sport)

### 8.2 Team builder
- Team Manager creates a team: name, sport, type (Playing/Practice), gender
- Playing team: one official roster — athletes assigned here count for match attendance
- Practice team: separate entity, same athletes can appear in multiple practice teams
- Roster builder UI: searchable athlete list on left, drag-add to team on right (or checkbox select + add button)

### 8.3 Session scheduler
- Create session: team, date, time, location, duration, optional notes
- **Recurrence picker** (iPhone-style):
  - Options: Does not repeat / Daily / Weekly / Custom
  - Weekly: checkboxes for each day of week (Mon–Sun)
  - Custom: set interval + specific days
  - End: Never / On date / After N occurrences
  - **Edit one vs edit all** prompt when editing a recurring session (like iOS Calendar)
  - Per-occurrence overrides stored in `SessionOverride` table
- Generated occurrences: each is a `PracticeSession` row linked to the `RecurrenceRule`
- Calendar view: monthly/weekly toggle (use `react-big-calendar` or shadcn-compatible calendar)
- Session statuses: Scheduled → In Progress → Completed / Cancelled

### 8.4 Attendance marking (the day-of flow)
- Coach/Manager opens their app (PWA) → sees "Today's Sessions" on dashboard
- Taps a session → sees full roster of assigned athletes
- For each athlete: tap **Present** or **Absent** button (large tap targets, mobile-optimised)
- If **Absent**: optional text field slides in → "Reason for absence" (free text)
- Additional status: **Late** (marked present but arrived late) and **Excused** (absent with accepted reason)
- Bulk action: "Mark all present" button → then individually toggle exceptions
- Auto-save: each tap calls `PATCH /api/attendance` immediately (no submit button needed)
- Real-time: if two coaches mark simultaneously, last-write-wins (acceptable for this scale)
- Session can be marked even after the scheduled time (retroactive logging allowed)

### 8.5 Reports & analytics
Real-time, auto-generated — no manual export needed (export is additional).

**Per-athlete:**
- Overall attendance % (all sessions)
- Attendance % per team
- Streak: current consecutive present sessions
- Absence trend: chart over rolling 30/60/90 days
- List of all sessions with status

**Per-team:**
- Session-by-session attendance rate
- Top attenders / most absent
- Heatmap: which days/times have lowest attendance

**Per-session:**
- Attendance rate for that session
- Absent list with reasons

**Export:** PDF and CSV per report (use `@react-pdf/renderer` for PDF)

### 8.6 Notifications (via Resend)
- Notification manager UI at `/back-office/notifications`
- Per-user preferences: enable/disable email, set reminder timings
- System triggers:
  - **Session reminder**: sent N minutes before session (configurable: default 24h + 1h)
  - **Session cancelled**: immediate
  - **Session rescheduled**: immediate with new details
  - **Attendance report**: auto-sent after session marked complete (to manager/coach of that team)
- Queue: use Redis to queue scheduled notification jobs (simple cron-style via `node-cron` or Vercel/DO scheduled tasks)
- Email templates: build with Resend's React Email — branded, navy/white

---

## 9. PWA Configuration

### `next-pwa` setup (`next.config.js`)
```js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // Cache API GETs for attendance reads
    { urlPattern: /^\/api\/attendance/, handler: 'NetworkFirst', options: { cacheName: 'attendance-api', expiration: { maxAgeSeconds: 300 } } },
    { urlPattern: /^\/api\/sessions/, handler: 'NetworkFirst', options: { cacheName: 'sessions-api', expiration: { maxAgeSeconds: 300 } } },
    // Static assets — cache first
    { urlPattern: /\.(png|jpg|svg|woff2)$/, handler: 'CacheFirst', options: { cacheName: 'static-assets' } },
  ],
})
```

### `public/manifest.json`
```json
{
  "name": "West End Sports Club",
  "short_name": "WESC",
  "description": "West End Sports Club — team management and attendance platform",
  "start_url": "/back-office/dashboard",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#162060",
  "background_color": "#0D1640",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### PWA UX priorities
- Attendance marking sheet must work offline (queue writes to IndexedDB, sync on reconnect)
- "Add to home screen" prompt shown to coaches/managers after 2nd login
- Back-office sidebar is the primary nav on mobile (bottom tab bar on small screens — 5 key tabs: Dashboard, Athletes, Sessions, Attendance, Notifications)

---

## 10. API Route Conventions

All API routes at `src/app/api/`:

```
GET    /api/athletes              list with filters
POST   /api/athletes              create
GET    /api/athletes/[id]         detail
PATCH  /api/athletes/[id]         update
DELETE /api/athletes/[id]         soft delete (set isActive=false)

GET    /api/teams                 list
POST   /api/teams                 create
GET    /api/teams/[id]            detail + roster
PATCH  /api/teams/[id]
POST   /api/teams/[id]/athletes   add athlete to team

GET    /api/sports                list
POST   /api/sports                create (admin only)
PATCH  /api/sports/[id]
DELETE /api/sports/[id]

GET    /api/sessions              list (filter: teamId, date range, status)
POST   /api/sessions              create (handles recurrence generation)
GET    /api/sessions/[id]         detail + attendance logs
PATCH  /api/sessions/[id]         update (one or all in series)
DELETE /api/sessions/[id]

GET    /api/attendance/[sessionId]      get attendance sheet for session
POST   /api/attendance                  create/update a log entry
GET    /api/attendance/reports/athlete/[id]
GET    /api/attendance/reports/team/[id]

GET    /api/notifications/preferences   get user prefs
PATCH  /api/notifications/preferences   update user prefs
POST   /api/notifications/send          internal — called by scheduler
```

### Response format (consistent across all routes)
```ts
// Success
{ data: T, meta?: { total: number, page: number } }

// Error
{ error: string, code: string }
```

### Middleware pattern
```ts
// All back-office API routes use this wrapper
export async function GET(req: Request) {
  const session = await requireAuth(req, ['ADMIN', 'TEAM_MANAGER', 'COACH'])
  if (!session) return unauthorized()
  // ... handler
}
```

---

## 11. Component Conventions

### shadcn/ui usage
- Install components with `npx shadcn@latest add [component]` — never hand-write Radix primitives
- Components to install: `button`, `card`, `form`, `input`, `select`, `table`, `badge`, `avatar`, `dialog`, `sheet`, `tabs`, `calendar`, `popover`, `dropdown-menu`, `separator`, `toast`, `skeleton`, `progress`, `switch`, `checkbox`, `textarea`, `sidebar`
- Override colours only via CSS variables in `globals.css` — never pass Tailwind colour classes directly to shadcn components

### Naming
- Components: PascalCase, named exports
- Hooks: camelCase prefixed `use`
- API handlers: named exports `GET`, `POST`, `PATCH`, `DELETE`
- Types: PascalCase, in `src/types/index.ts`
- DB models: PascalCase (Prisma convention)

### Data fetching
- Server components for initial page load (use Prisma directly in RSC)
- Client components for interactive UI (use `useSWR` or `fetch` for mutations)
- Mutations: `fetch` with `PATCH`/`POST` — no separate query library needed at this scale
- Optimistic updates on attendance marking (immediate UI feedback, background save)

---

## 12. Security Requirements

- All back-office routes protected by NextAuth middleware — redirect to `/login` if unauthenticated
- Role checks on both route AND API level (never trust client-side role checks alone)
- Rate limiting on auth routes via Redis (`/api/auth` max 10 req/min per IP)
- CSRF: NextAuth handles this for session-based auth
- Input sanitisation: Zod schemas on all API inputs (install `zod`)
- SQL injection: Prisma parameterised queries — never raw SQL without `$queryRaw` and explicit sanitisation
- Environment variables: never expose secrets client-side (`NEXT_PUBLIC_` prefix only for non-sensitive values)
- Cloudflare WAF: block bots, rate-limit login endpoint at CDN level
- HTTPS only: enforced at Cloudflare (redirect HTTP → HTTPS)
- Sensitive fields (ID card numbers): never logged, never returned in list endpoints (only in detail views)

---

## 13. Build & Deployment

### Local development
```bash
npm install
npx prisma generate
npx prisma db push          # dev only — use migrate in production
npm run dev
```

### GitHub workflow
- `develop` branch → staging (DO App Platform staging app)
- `main` branch → production (DO App Platform production app)
- PR required to merge to `main` — no direct pushes
- DO App Platform auto-detects push to linked branch and redeploys

### DO App Platform config (`/.do/app.yaml`)
```yaml
name: westend-sports-club
services:
  - name: web
    source_dir: /
    build_command: npm run build
    run_command: npm start
    environment_slug: node-js
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        type: SECRET
      - key: REDIS_URL
        scope: RUN_TIME
        type: SECRET
      - key: NEXTAUTH_SECRET
        scope: RUN_TIME
        type: SECRET
      - key: NEXTAUTH_URL
        scope: RUN_TIME
        value: https://westendsportsclub.mv
      - key: RESEND_API_KEY
        scope: RUN_TIME
        type: SECRET
      - key: NEXT_PUBLIC_APP_URL
        scope: RUN_BUILD_TIME
        value: https://westendsportsclub.mv
```

### Redis (DO Droplet — self-hosted)
- 1GB RAM Droplet (Basic, $6/mo) running Redis OSS
- Bind to private network — accessible only from App Platform via private IP
- `REDIS_URL=redis://:password@private-ip:6379`
- Persist with AOF (`appendonly yes`)

### DO Managed PostgreSQL
- Starter plan (1 node) for Phase 1
- Connection pooling via PgBouncer (DO provides this)
- `DATABASE_URL` = pooler connection string

---

## 14. Phase 1 Build Order

Build in this exact sequence — each step is a working, deployable increment:

1. **Project scaffold** — `create-next-app`, shadcn init, Prisma init, commit to GitHub, connect DO App Platform, Cloudflare DNS pointing to DO
2. **Holding page** — `/` public route with brand design, email capture (store in DB), social links, PWA manifest
3. **Database + Redis** — Prisma schema (above), run migration on DO Managed DB, Redis client connected
4. **Auth** — NextAuth setup, login page, middleware protecting `/back-office/*`, User CRUD, role gates
5. **Sports management** — Admin-only: CRUD sports (Handball, Football, Futsal, Basketball, Beach Volleyball, Beach Handball + custom)
6. **Athlete management** — Full CRUD, CSV import, search/filter, sport + team assignment
7. **Team management** — Create playing teams and practice teams, roster builder, assign athletes
8. **Session scheduler** — Create sessions with full recurrence logic (daily/weekly/custom + per-occurrence overrides), calendar view
9. **Attendance marking** — Day-of flow: session roster → mark present/absent/late/excused → auto-save → offline queue
10. **Reports & analytics** — Per-athlete, per-team, per-session dashboards with real-time stats
11. **Notifications** — Resend integration, preference manager, scheduled reminders, post-session reports
12. **PWA polish** — Offline fallback, install prompt, mobile bottom nav, service worker caching

---

## 15. Key Libraries

```json
{
  "dependencies": {
    "next": "14.x",
    "react": "18.x",
    "typescript": "5.x",
    "@prisma/client": "latest",
    "next-auth": "5.x",
    "ioredis": "latest",
    "resend": "latest",
    "next-pwa": "latest",
    "framer-motion": "latest",
    "zod": "latest",
    "bcryptjs": "latest",
    "swr": "latest",
    "react-big-calendar": "latest",
    "date-fns": "latest",
    "@react-pdf/renderer": "latest",
    "papaparse": "latest",
    "idb": "latest"
  },
  "devDependencies": {
    "prisma": "latest",
    "@types/bcryptjs": "latest",
    "@types/papaparse": "latest",
    "tailwindcss": "latest",
    "eslint": "latest",
    "prettier": "latest"
  }
}
```

---

## 16. What This File Does NOT Cover (Phase 2)

The following are intentionally deferred to Phase 2 and should NOT be built during Phase 1:

- Public-facing full website (all pages beyond holding page)
- Member portal and membership management
- Store / merchandise CMS
- Blog / news CMS
- Sponsor pages
- Payment integration
- Full SEO layer
- Social media feed embeds
- Match attendance (separate from practice attendance — schema supports it, UI deferred)

---

## 17. Notes for Claude Code

- Always read this file in full at the start of each session
- Never install dependencies not listed in Section 15 without flagging it first
- Never deviate from the directory structure in Section 5
- Never skip the auth check layer — every back-office API must call `requireAuth()`
- When in doubt about a UI component, check if shadcn has it before building custom
- Attendance marking UI must be designed for one-thumb mobile use — large tap targets (min 44×44px)
- The recurrence scheduler is the most complex UI — build and test it thoroughly before moving to analytics
- All Prisma queries in server components must use the singleton client from `src/lib/prisma.ts`
- Run `npx prisma format` before committing any schema changes
- Run `npx prisma migrate dev --name [description]` for every schema change in development
- Commit migration files to GitHub — they run automatically on DO via build command
- Keep components small — if a component exceeds ~150 lines, split it
- Use `cn()` from `src/lib/utils.ts` for all conditional Tailwind class merging
