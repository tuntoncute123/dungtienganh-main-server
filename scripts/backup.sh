#!/bin/bash
# ============================================================
# TeacherDung - Auto Database Backup Script
# Chạy lúc 3h sáng mỗi ngày, backup PostgreSQL + QuestDB
# Upload lên Cloudflare R2, giữ 7 bản backup gần nhất
# ============================================================

set -e

# --- Cấu hình ---
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/teacherdung-backup/$DATE"
LOG_FILE="/var/log/teacherdung-backup.log"

# PostgreSQL
PG_CONTAINER="postgresql-database-jwhpkpz687g7nhb7wdg18sqd"
PG_USER="postgres"
PG_DB="teacherdung"

# QuestDB
QDB_CONTAINER="questdb-service"

# Cloudflare R2
R2_BUCKET="dungtienganh"
R2_ENDPOINT="https://b02d851761fea34a72e1b509985838f1.r2.cloudflarestorage.com"
R2_ACCESS_KEY="ca1402001681b40e0fc71a34acbd1510"
R2_SECRET_KEY="c775bf48b17286d848e27ba782f678a1cccf3aeff8117ac85058fa5c539762df"
R2_BACKUP_PREFIX="database-backups"
RETAIN_DAYS=7

# --- Helper log ---
log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# --- Setup ---
log "========================================"
log "TeacherDung Backup Started"
log "========================================"
mkdir -p "$BACKUP_DIR"

# --- Cấu hình AWS CLI cho R2 ---
export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_KEY"
export AWS_DEFAULT_REGION="auto"

# --- 1. Backup PostgreSQL ---
log "[1/4] Backing up PostgreSQL..."
PG_BACKUP_FILE="$BACKUP_DIR/postgres_$DATE.sql.gz"

docker exec "$PG_CONTAINER" pg_dump -U "$PG_USER" "$PG_DB" | gzip > "$PG_BACKUP_FILE"

if [ -f "$PG_BACKUP_FILE" ]; then
  PG_SIZE=$(du -sh "$PG_BACKUP_FILE" | cut -f1)
  log "  PostgreSQL backup OK: $PG_BACKUP_FILE ($PG_SIZE)"
else
  log "  ERROR: PostgreSQL backup FAILED!"
  exit 1
fi

# --- 2. Backup QuestDB ---
log "[2/4] Backing up QuestDB..."
QDB_BACKUP_FILE="$BACKUP_DIR/questdb_$DATE.tar.gz"

# Snapshot QuestDB data volume bằng cách copy từ container
docker exec "$QDB_CONTAINER" tar -czf - /var/lib/questdb/db /var/lib/questdb/conf 2>/dev/null \
  > "$QDB_BACKUP_FILE" || \
  docker run --rm -v questdb_data:/data alpine tar -czf - /data > "$QDB_BACKUP_FILE"

if [ -f "$QDB_BACKUP_FILE" ]; then
  QDB_SIZE=$(du -sh "$QDB_BACKUP_FILE" | cut -f1)
  log "  QuestDB backup OK: $QDB_BACKUP_FILE ($QDB_SIZE)"
else
  log "  WARNING: QuestDB backup may have failed, continuing..."
fi

# --- 3. Upload lên Cloudflare R2 ---
log "[3/4] Uploading to Cloudflare R2..."

# Upload PostgreSQL backup
aws s3 cp "$PG_BACKUP_FILE" \
  "s3://$R2_BUCKET/$R2_BACKUP_PREFIX/postgres/postgres_$DATE.sql.gz" \
  --endpoint-url "$R2_ENDPOINT" \
  --no-progress

log "  PostgreSQL uploaded to R2: $R2_BACKUP_PREFIX/postgres/postgres_$DATE.sql.gz"

# Upload QuestDB backup
if [ -f "$QDB_BACKUP_FILE" ]; then
  aws s3 cp "$QDB_BACKUP_FILE" \
    "s3://$R2_BUCKET/$R2_BACKUP_PREFIX/questdb/questdb_$DATE.tar.gz" \
    --endpoint-url "$R2_ENDPOINT" \
    --no-progress
  log "  QuestDB uploaded to R2: $R2_BACKUP_PREFIX/questdb/questdb_$DATE.tar.gz"
fi

# --- 4. Dọn dẹp các bản backup cũ trên R2 (giữ lại 7 ngày gần nhất) ---
log "[4/4] Cleaning old backups (older than $RETAIN_DAYS days)..."
CUTOFF_DATE=$(date -d "-${RETAIN_DAYS} days" +%Y%m%d 2>/dev/null || date -v-${RETAIN_DAYS}d +%Y%m%d)

for PREFIX in "postgres" "questdb"; do
  aws s3 ls "s3://$R2_BUCKET/$R2_BACKUP_PREFIX/$PREFIX/" \
    --endpoint-url "$R2_ENDPOINT" | \
  awk '{print $4}' | \
  while read -r FILENAME; do
    # Extract date from filename (format: postgres_YYYYMMDD_HHMMSS.*)
    FILE_DATE=$(echo "$FILENAME" | grep -oP '\d{8}' | head -1)
    if [ -n "$FILE_DATE" ] && [ "$FILE_DATE" -lt "$CUTOFF_DATE" ]; then
      log "  Deleting old backup: $R2_BACKUP_PREFIX/$PREFIX/$FILENAME"
      aws s3 rm "s3://$R2_BUCKET/$R2_BACKUP_PREFIX/$PREFIX/$FILENAME" \
        --endpoint-url "$R2_ENDPOINT"
    fi
  done
done

# --- Cleanup local temp files ---
rm -rf "$BACKUP_DIR"
log "Local temp files cleaned."

log "========================================"
log "TeacherDung Backup COMPLETED successfully!"
log "  - PostgreSQL: postgres_$DATE.sql.gz"
log "  - QuestDB: questdb_$DATE.tar.gz"
log "========================================"
