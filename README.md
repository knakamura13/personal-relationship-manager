# Personal Relationship Manager (PRM)

An ultra-simple Personal Relationship & Log Manager app designed for mobile-first use with a responsive web interface.

## Features

### Personal Relationship Manager

- Maintain a separate contact list (not tied to iOS Contacts)
- Store name + free-form notes for each contact
- Basic tagging system with ability to add from existing tags or create new ones
- Sort alphabetically or by recently-updated
- Full-text fuzzy search over names, notes, and tags

### Log Manager

- Create chronological log entries (entry + optional details) for anything
- Search and filter logs by date or keyword
- Reverse-chronological order (newest entries first)
- Tag support with same functionality as contacts

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Icons**: Lucide React
- **Deployment**: Railway.app

## Database Setup

This project uses **PostgreSQL for both local development and production**, hosted on Railway.app. This ensures complete synchronization between environments and eliminates schema conflicts.

### Architecture

- **Production**: Railway PostgreSQL database
- **Local Development**: Connects to the same Railway PostgreSQL database via public URL
- **Schema**: Single PostgreSQL schema shared across all environments
- **Migrations**: Managed by Prisma and automatically applied on Railway deployments

### Benefits of This Setup

✅ **No environment drift** - Local and production use identical database  
✅ **No schema switching** - PostgreSQL everywhere  
✅ **Simplified deployment** - No database migration coordination needed  
✅ **Real data testing** - Test with actual production data locally  
✅ **Railway managed** - Automatic backups, scaling, and maintenance

## Local Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory with your Railway database's **public URL**:

   ```env
   DATABASE_URL="postgresql://postgres:password@junction.proxy.rlwy.net:12345/railway"
   ```

   **To get your Railway database URL:**

   - Go to your Railway dashboard
   - Click on your PostgreSQL service (not your app)
   - Go to the "Connect" tab
   - Copy the "Public URL" or "External URL"

3. **Generate Prisma client**:

   ```bash
   npx prisma generate
   ```

4. **Verify database connection** (optional):

   ```bash
   npx prisma migrate deploy
   ```

5. **Start the development server**:

   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Schema Changes Workflow

When you need to modify the database schema (add tables, columns, etc.), follow this workflow:

### 1. Update Prisma Schema

Edit `prisma/schema.prisma` with your changes:

```prisma
model Contact {
  // ... existing fields ...
  newField String? // Your new field
}
```

### 2. Create Migration

Generate a new migration file:

```bash
npx prisma migrate dev --name descriptive_migration_name
```

This will:

- Create a new migration file in `prisma/migrations/`
- Apply the migration to your Railway database
- Regenerate the Prisma client

### 3. Test Locally

Test your changes thoroughly in the local development environment.

### 4. Commit and Deploy

```bash
git add .
git commit -m "feat: add new field to Contact model"
git push origin main
```

Railway will automatically:

- Run `npx prisma migrate deploy` during deployment
- Apply any pending migrations to the production database
- Build and deploy your app

### 5. Migration Commands Reference

| Command                                            | Purpose                                       |
| -------------------------------------------------- | --------------------------------------------- |
| `npx prisma migrate dev --name <name>`             | Create and apply new migration locally        |
| `npx prisma migrate deploy`                        | Apply pending migrations (used in production) |
| `npx prisma migrate reset`                         | Reset database and apply all migrations       |
| `npx prisma migrate resolve --applied <migration>` | Mark failed migration as resolved             |
| `npx prisma generate`                              | Regenerate Prisma client after schema changes |
| `npx prisma studio`                                | Open database browser UI                      |

### 6. Best Practices

- **Always create migrations** instead of using `prisma db push` for production
- **Use descriptive migration names** like `add_tags_to_logs` or `create_user_preferences`
- **Test migrations locally first** before deploying
- **Commit migration files** to version control
- **Never manually edit migration files** after they've been applied

### 7. Troubleshooting

**Migration fails on Railway:**

```bash
# Mark problematic migration as resolved (if safe)
npx prisma migrate resolve --applied <migration_name>

# Or reset and replay all migrations (DANGER: loses data)
npx prisma migrate reset
```

**Schema out of sync:**

```bash
# Regenerate client
npx prisma generate

# Push schema changes (development only)
npx prisma db push
```

## Deployment to Railway.app

1. **Connect your repository** to Railway.app

2. **Database Setup**:

   - Railway automatically provisions a PostgreSQL database
   - The `DATABASE_URL` environment variable is set automatically
   - Use the same URL locally for development

3. **Environment Variables**:

   - Railway sets `DATABASE_URL` automatically
   - No additional environment variables needed

4. **Deploy**:
   - Railway automatically runs migrations via `scripts/deploy.js`
   - Builds and deploys your app
   - Zero-downtime deployments

## Database Commands

- `npx prisma generate` - Generate Prisma client
- `npx prisma migrate dev` - Create and apply migrations (development)
- `npx prisma migrate deploy` - Apply migrations (production)
- `npx prisma studio` - Open Prisma Studio to view/edit data
- `npx prisma db seed` - Run database seeds (if configured)

## Design Principles

- **Mobile-first**: Optimized for mobile devices with responsive design
- **Manual data entry only**: No auto-imports or external integrations
- **Simple and focused**: Only essential features, no bloat
- **Cost-effective**: Designed to run affordably on Railway.app
- **Database simplicity**: Single PostgreSQL instance for all environments

## Non-Features (Intentionally Excluded)

- No auto-import from LinkedIn, Gmail, or social networks
- No sales pipelines or CRM features
- No analytics dashboards or AI insights
- No complex tagging beyond basic labels
- No team collaboration tools
