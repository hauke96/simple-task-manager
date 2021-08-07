#!/bin/bash

set -e

echo "Start backup job"

DIR=backups
YESTERDAY=$(date --date="yesterday" +%Y-%m-%d)

echo "Create output folder"
mkdir -p $DIR
echo "Done"

echo "Create compressed database dump"
pg_dump -h $STM_DB_HOST -U $STM_DB_USERNAME --create -d stm | gzip -9 > "$DIR/stm-db-backup_$YESTERDAY.sql.gz"
echo "Done"

echo "Finished backup job"
