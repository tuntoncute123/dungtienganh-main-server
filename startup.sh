#!/bin/sh
echo "=== STARTUP SH START ==="
echo "Checking environment..."
if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set!"
  exit 1
else
  echo "DATABASE_URL is set."
fi

echo "Running prisma migrations..."
npx prisma migrate deploy
MIGRATE_STATUS=$?
echo "Migration finished with exit code: $MIGRATE_STATUS"
if [ $MIGRATE_STATUS -ne 0 ]; then
  echo "Error: Prisma migration failed! Keeping container alive for debugging..."
  sleep 600
  exit $MIGRATE_STATUS
fi

echo "Starting NestJS application on port 3001..."
node dist/main
NEST_STATUS=$?
echo "NestJS application exited with code: $NEST_STATUS. Keeping container alive for debugging..."
sleep 600
exit $NEST_STATUS
