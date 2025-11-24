FROM alpine:3.20

# Install Postgres client and AWS CLI
RUN apk add --no-cache postgresql-client aws-cli ca-certificates bash

WORKDIR /app

# Copy only the backup script (keeps image small and focused)
COPY scripts/backup-to-s3.sh ./backup-to-s3.sh

RUN chmod +x ./backup-to-s3.sh

# Default command: run one backup and exit
CMD ["sh", "-c", "./backup-to-s3.sh"]


