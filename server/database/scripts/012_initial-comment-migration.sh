#!/bin/bash

source scripts/common.sh

OUTPUT_FILE=".tmp.initial-comment-migration.sql"
TASK_IDS=$(psql -h $STM_DB_HOST -U $STM_DB_USERNAME -t -A -c "SELECT id FROM tasks;" $STM_DB_DATABASE)
PROJECT_IDS=$(psql -h $STM_DB_HOST -U $STM_DB_USERNAME -t -A -c "SELECT id FROM projects;" $STM_DB_DATABASE)

begin_tx

for TASK_ID in $TASK_IDS
do
	echo "WITH new_comment_list AS (INSERT INTO comment_lists DEFAULT VALUES RETURNING id, $TASK_ID as tid) UPDATE tasks t SET comment_list_id = n.id FROM new_comment_list n WHERE t.id = n.tid;" >> $OUTPUT_FILE
done
for PROJECT_ID in $PROJECT_IDS
do
	echo "WITH new_comment_list AS (INSERT INTO comment_lists DEFAULT VALUES RETURNING id, $PROJECT_ID as pid) UPDATE projects p SET comment_list_id = n.id FROM new_comment_list n WHERE p.id = n.pid;" >> $OUTPUT_FILE
done

echo "ALTER TABLE tasks ALTER COLUMN comment_list_id SET NOT NULL;" >> $OUTPUT_FILE
echo "ALTER TABLE projects ALTER COLUMN comment_list_id SET NOT NULL;" >> $OUTPUT_FILE

set_version "012"

end_tx

execute