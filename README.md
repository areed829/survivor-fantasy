# Survivor Fantasy

A Fantasy Survivor game inspired by the TV show *Survivor*. Draft castaways, track episode outcomes, and compete for the crown!

## Tech Stack

- **Next.js** (App Router) - React framework
- **TypeScript** - Type safety
- **tRPC** - End-to-end typesafe APIs
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **Tailwind CSS** - Styling
- **Clerk** - Authentication

## Features

### MVP Features

- ✅ Multi-season leagues
- ✅ Draft system (snake draft)
- ✅ Episode outcome tracking
- ✅ Spoiler lock protection
- ✅ Commissioner role with admin actions
- ✅ Scoring system with configurable rules
- ✅ Standings and leaderboards

### Future Features (Schema Ready)

- Waivers/trades via Transaction model
- Captain mechanics
- Custom scoring configurations

## Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Clerk account for authentication

### Installation

1. Clone the repository:
```bash
git clone https://github.com/areed829/survivor-fantasy.git
cd survivor-fantasy
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory with the following:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/survivor_fantasy?schema=public"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Next.js
NEXT_PUBLIC_PORT=3000
```

Replace the values with your actual:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
- `CLERK_SECRET_KEY` - From Clerk dashboard

4. Set up the database:
```bash
# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate

# (Optional) Seed with sample data
npm run db:seed
```

5. Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## Clerk Configuration

1. Create a Clerk account at https://clerk.com
2. Create a new application
3. Copy your publishable key and secret key to `.env`
4. Configure Clerk settings:
   - Enable email/password authentication (or your preferred method)
   - Set up redirect URLs for your environment

## Database Migrations

```bash
# Create a new migration
npm run db:migrate

# Apply migrations to production
npx prisma migrate deploy

# Open Prisma Studio to view/edit data
npm run db:studio
```

## Gameplay Flow

### 1. Create or Join a League

- **Create League**: As a commissioner, create a new league and get an invite code
- **Join League**: Use an invite code to join an existing league

### 2. Create a Season

Commissioners can create seasons within a league with configurable settings:
- Roster size (default: 6)
- Draft type (Snake or Linear)
- Pick timer (default: 90 seconds, 0 = untimed)
- Captain mechanics (enabled/disabled)
- Spoiler lock (enabled/disabled)

### 3. Add Castaways

Commissioners can add castaways:
- Manually via form
- Bulk upload via CSV

### 4. Draft

- Snake draft order is automatically calculated
- Users take turns selecting castaways
- Draft room shows available castaways and draft board
- Roster locks after draft completion

### 5. Track Episodes

- Commissioners create episodes with air dates
- If spoiler lock is enabled, outcomes cannot be entered until after air date
- Commissioners can override spoiler lock per episode

### 6. Enter Outcomes

Commissioners enter episode outcomes:
- Immunity win: +2 points
- Reward win: +1 point
- Idol/advantage found: +2 points
- Idol played successfully: +3 points
- Voted out: -2 points
- Final tribal: +5 points
- Winner: +10 points

### 7. View Standings

- Per-episode scores
- Cumulative season totals
- Leaderboard rankings

## Scoring System

### Default Scoring

- **Immunity Win**: +2
- **Reward Win**: +1
- **Idol/Advantage Found**: +2
- **Idol Played Successfully**: +3
- **Voted Out**: -2
- **Final Tribal**: +5
- **Winner**: +10

Scoring is configurable per season via `scoringConfig` JSON field.

## Spoiler Locks

When enabled, episodes are locked until after their air date. This prevents accidental spoilers from being entered. Commissioners can override the lock per episode if needed.

## Architecture

### tRPC Routers

- `league` - League management (create, join, list)
- `season` - Season management (create, update, list)
- `episode` - Episode management (create, update, list)
- `castaway` - Castaway management (create, update, delete, bulk upload)
- `draft` - Draft operations (get draft, make picks, view rosters)
- `scoring` - Scoring operations (enter outcomes, view standings)

### Services

- `draftService` - Draft logic (order calculation, pick validation)
- `scoringService` - Score calculation and recalculation
- `spoilerLockService` - Episode lock validation

### Authorization

- `requireAuth()` - Requires authenticated user
- `requireLeagueMember(leagueId)` - Requires league membership
- `requireCommissioner(leagueId)` - Requires commissioner role

All authorization is enforced server-side via tRPC procedures.

## Development

### Project Structure

```
src/
  app/              # Next.js App Router pages
  server/           # Server-side code
    routers/        # tRPC routers
    services/       # Business logic
    db.ts          # Prisma client
    auth.ts        # Auth helpers
    trpc.ts        # tRPC setup
  trpc/            # tRPC client setup
prisma/
  schema.prisma    # Database schema
  seed.ts          # Seed script
```

### Adding New Features

1. Update Prisma schema if needed
2. Run migration: `npm run db:migrate`
3. Create/update tRPC router
4. Add service logic if needed
5. Create UI components/pages
6. Add zod validation

## Security

- No hardcoded secrets (use `.env`)
- All inputs validated with zod
- Server-side authorization enforced
- RBAC for commissioner actions
- Spoiler locks enforced server-side

## License

ISC
