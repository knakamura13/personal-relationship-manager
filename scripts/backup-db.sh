#!/bin/bash
# Backup Railway PostgreSQL database

set -e

echo "🔍 Getting database connection string from Railway..."

# Get DATABASE_PUBLIC_URL from Railway (for external connections)
DB_URL=$(railway variables --json | jq -r '.DATABASE_PUBLIC_URL')

if [ -z "$DB_URL" ] || [ "$DB_URL" == "null" ]; then
    echo "❌ Could not retrieve DATABASE_PUBLIC_URL from Railway"
    echo "💡 Make sure you're linked to the Postgres service: railway link"
    exit 1
fi

# Create backup filename with timestamp
BACKUP_DIR="backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.dump"

echo "📦 Creating backup: $BACKUP_FILE"
echo "🔗 Connecting to: ${DB_URL%%@*}@***"  # Hide password in output

# Find pg_dump - prefer PostgreSQL 16 to match Railway's server version
PG_DUMP=""
if [ -f "/opt/homebrew/opt/postgresql@16/bin/pg_dump" ]; then
    PG_DUMP="/opt/homebrew/opt/postgresql@16/bin/pg_dump"
elif command -v pg_dump &> /dev/null; then
    PG_DUMP=$(command -v pg_dump)
else
    echo "❌ pg_dump not found!"
    echo ""
    echo "📥 Install PostgreSQL 16 client tools (to match Railway's PostgreSQL 16):"
    echo "   brew install postgresql@16"
    echo ""
    echo "   Then add to your PATH:"
    echo "   echo 'export PATH=\"/opt/homebrew/opt/postgresql@16/bin:\$PATH\"' >> ~/.zshrc"
    echo "   source ~/.zshrc"
    exit 1
fi

# Check pg_dump version
PG_DUMP_VERSION=$($PG_DUMP --version | grep -oE '[0-9]+\.[0-9]+' | head -1)
echo "🔧 Using pg_dump version: $PG_DUMP_VERSION"

# Create backup (custom format for smaller size and faster restore)
$PG_DUMP -Fc "$DB_URL" > "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo "✅ Backup complete!"
    echo "   File: $BACKUP_FILE"
    echo "   Size: $BACKUP_SIZE"
    echo ""
    echo "💡 To restore this backup:"
    PG_RESTORE=${PG_DUMP/pg_dump/pg_restore}
    echo "   $PG_RESTORE -d \$DATABASE_URL $BACKUP_FILE"
else
    echo "❌ Backup failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

