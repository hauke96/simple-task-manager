#!/bin/bash

source scripts/common.sh

OUTPUT_FILE=".tmp.migrate-project-task-relation.sql"
RAW_DATA=$(psql -h $STM_DB_HOST -U $STM_DB_USERNAME -t -A -c "SELECT id,task_ids FROM projects;" $STM_DB_DATABASE | tr -d "{" | tr -d "}")

begin_tx

IFS=$'\n'
for ROW in $RAW_DATA
do
	IFS='|' read -ra ROW_ARRAY <<< "$ROW"

	PROJECT_ID=${ROW_ARRAY[0]}
	TASK_IDS=${ROW_ARRAY[1]}

	IFS=$','
	for TASK_ID in $TASK_IDS
	do
		echo "UPDATE tasks SET project_id = $PROJECT_ID WHERE id = $TASK_ID;" >> $OUTPUT_FILE
	done

	IFS=$'\n'
done

#
# Set version
#
set_version "008"

#
# Generate the SQL script
#
end_tx

execute