#!/bin/sh
# Backup Railway PostgreSQL database to AWS S3
#
# Expected environment variables:
#   DATABASE_URL        - Postgres connection string
#   AWS_ACCESS_KEY_ID   - IAM user access key
#   AWS_SECRET_ACCESS_KEY - IAM user secret
#   AWS_DEFAULT_REGION  - AWS region for S3 bucket (e.g. us-west-2)
#   AWS_S3_BUCKET       - S3 bucket name (no s3:// prefix)
#   AWS_S3_PREFIX       - Optional key prefix in the bucket (e.g. "prm-backups/")
#
# This script is intended to run inside a Railway service where DATABASE_URL
# is already set for the Postgres instance.

set -eu

echo "🔍 Validating environment..."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

if [ -z "${AWS_S3_BUCKET:-}" ]; then
  echo "❌ AWS_S3_BUCKET is not set"
  exit 1
fi

if [ -z "${AWS_ACCESS_KEY_ID:-}" ] || [ -z "${AWS_SECRET_ACCESS_KEY:-}" ]; then
  echo "❌ AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY not set"
  exit 1
fi

if [ -z "${AWS_DEFAULT_REGION:-}" ]; then
  echo "❌ AWS_DEFAULT_REGION is not set"
  exit 1
fi

PG_DUMP_BIN="${PG_DUMP_BIN:-pg_dump}"

echo "🔧 Using pg_dump binary: $PG_DUMP_BIN"
$PG_DUMP_BIN --version || {
  echo "❌ pg_dump not found or not executable"
  exit 1
}

TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
FILENAME="backup-${TIMESTAMP}.dump"
PREFIX="${AWS_S3_PREFIX:-}"

# Ensure prefix ends with / if set and not already
if [ -n "$PREFIX" ] && [ "${PREFIX%/}" = "$PREFIX" ]; then
  PREFIX="${PREFIX}/"
fi

S3_URI="s3://${AWS_S3_BUCKET}/${PREFIX}${FILENAME}"

echo "📦 Creating backup and streaming directly to S3..."
echo "   Target: ${S3_URI}"

# We stream pg_dump output directly into aws s3 cp to avoid local disk usage.
set -o pipefail
$PG_DUMP_BIN -Fc "$DATABASE_URL" | aws s3 cp - "$S3_URI"

echo "✅ Backup uploaded successfully to ${S3_URI}"


