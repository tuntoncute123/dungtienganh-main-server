#!/bin/sh
mkdir -p /app/logs
echo "=== STARTUP SH START ===" >> /app/logs/startup.log 2>&1
echo "Checking environment..." >> /app/logs/startup.log 2>&1
echo "DATABASE_URL: $DATABASE_URL" >> /app/logs/startup.log 2>&1

echo "Running prisma migrations..." >> /app/logs/startup.log 2>&1
npx prisma migrate deploy >> /app/logs/startup.log 2>&1
MIGRATE_STATUS=$?
echo "Migration finished with exit code: $MIGRATE_STATUS" >> /app/logs/startup.log 2>&1

echo "Starting NestJS application on port 3001..." >> /app/logs/startup.log 2>&1
exec node dist/main >> /app/logs/startup.log 2>&1
