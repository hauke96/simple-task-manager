#!/bin/bash

pg_dump -h localhost -U $STM_DB_USERNAME --create -d stm | gzip -9 > stm-db-backup_$(date --date="yesterday" +%Y-%m-%d).sql.gz