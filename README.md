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

## Future Enhancements Roadmap

This section outlines potential improvements and features being considered for future development, organized by priority and implementation complexity.

### 🚀 High Impact, Low Effort

#### Contact-Log Linking

- Link log entries to specific contacts for relationship context
- Show related logs when viewing a contact
- Filter logs by contact with autocomplete contact selection

#### Quick Actions & Shortcuts

- Floating Action Button (FAB) for mobile quick-add functionality
- Keyboard shortcuts for power users (Ctrl+N, Ctrl+L)
- Swipe actions on mobile for quick edit/delete operations

#### Contact Interaction Tracking

- Add "last contacted" date to contacts
- Visual indicators for interaction recency
- Sort by "needs follow-up" for relationship maintenance
- Quick "log interaction" button on contact cards

#### Progressive Web App (PWA)

- Install as native app on mobile devices
- Offline viewing of cached data
- Push notifications for reminders

### 🎯 Medium Impact, Medium Effort

#### Simple Reminders System

- Basic "contact in X days" reminders without complex scheduling
- Browser notifications for due reminders
- Mark reminders complete when adding related logs

#### Data Export & Backup

- JSON export for data portability
- Simple backup/restore functionality
- Print-friendly views for contact lists

#### Enhanced Search & Filtering

- Advanced filters: date ranges, multiple tags, contact-specific logs
- Search history for quick re-searching
- Saved searches for common query patterns

#### Contact Relationship Mapping

- Basic relationship tags ("family", "colleague", "friend")
- Visual groupings in contact list
- Family/team clustering functionality

### 🔧 Quality of Life Improvements

#### Bulk Operations

- Multi-select for contacts and logs
- Bulk tagging, deletion, and export
- Batch operations for data maintenance

#### Simple Analytics Dashboard

- Contact/log count over time (without complex CRM analytics)
- Most frequently used tags
- Interaction frequency heatmap
- "Contact health" indicators for follow-up needs

#### Enhanced Mobile UX

- Bottom sheet modals instead of full-screen forms
- Pull-to-refresh gesture support
- Haptic feedback for interactions
- Improved thumb-friendly navigation

#### Smart Templates

- Pre-written log templates for common interactions
- Templates for "Coffee meeting", "Phone call", "Email exchange"
- Quick template insertion with customization options

#### Contact Import (Minimal)

- Simple, one-time CSV import for existing contact lists
- Basic name/notes import only (no ongoing sync)
- Maintains manual-only data entry philosophy

#### Enhanced Visual Design

- Contact avatars generated from initials when no photo uploaded
- Tag color coding utilization (leveraging existing color field)
- Activity timeline view for logs
- Dark mode optimizations

### 🏆 Top Priority Recommendations

The following three features would provide the highest value-to-effort ratio:

1. **Contact-Log Linking** - Creates powerful relationship context using existing infrastructure
2. **PWA + Offline Support** - Dramatically improves mobile-first experience
3. **Contact Interaction Tracking** - Enables proactive relationship maintenance

These enhancements align with the core mission of helping users maintain personal relationships while preserving the app's simplicity and mobile-first design philosophy.
