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

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Database**: SQLite with Prisma ORM
- **Icons**: Lucide React
- **Deployment**: Railway.app

## Local Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Set up environment variables**:
   Create a `.env` file in the root directory:

   ```env
   DATABASE_URL="file:./dev.db"
   ```

3. **Set up the database**:

   ```bash
   npm run db:push
   ```

4. **Start the development server**:

   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Deployment to Railway.app

1. **Connect your repository** to Railway.app
2. **Set environment variable**:
   - `DATABASE_URL="file:./prod.db"`
3. **Deploy** - Railway will automatically build and deploy your app

The app is designed to be cost-effective and will run within Railway's free tier limits.

## Database Commands

- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Create and apply migrations
- `npm run db:studio` - Open Prisma Studio to view/edit data

## Design Principles

- **Mobile-first**: Optimized for mobile devices with responsive design
- **Manual data entry only**: No auto-imports or external integrations
- **Simple and focused**: Only essential features, no bloat
- **Cost-effective**: Designed to run affordably on Railway.app

## Non-Features (Intentionally Excluded)

- No auto-import from LinkedIn, Gmail, or social networks
- No sales pipelines or CRM features
- No analytics dashboards or AI insights
- No complex tagging beyond basic labels
- No team collaboration tools
