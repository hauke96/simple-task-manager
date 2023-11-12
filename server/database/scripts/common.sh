#!/bin/bash

function begin_tx()
{
	echo "BEGIN TRANSACTION;" > $OUTPUT_FILE
}

function end_tx()
{
	echo "END TRANSACTION;" >> $OUTPUT_FILE
}

#
# Adds the parameter $1 to the db_version table
#
function set_version()
{
	echo "INSERT INTO db_versions VALUES('$1');" >> $OUTPUT_FILE
}

#
# Executes the SQL-script stored at $OUTPUT_FILE.
#
function execute()
{
	echo "Execute SQL..."

	psql -q -v ON_ERROR_STOP=1 -h $STM_DB_HOST -U $STM_DB_USERNAME -f $OUTPUT_FILE $STM_DB_DATABASE
	OK=$?
	if [ $OK -ne 0 ]
	then
		echo
		echo "Migration FAILED!"
		echo
		echo "Exit code: $OK"
		echo "See the error log and the '$OUTPUT_FILE' for details."
		exit 1
	fi

	echo "Migration DONE"

	echo "Remove '$OUTPUT_FILE'"
	rm $OUTPUT_FILE
}