#!/bin/bash

typeset -Ag UID_CACHE
OUTPUT_FILE=".tmp.migrate-user-names.sql"
#URL="https://master.apis.dev.openstreetmap.org"
URL="https://www.openstreetmap.org"

function nameToId()
{
	NAME="$1"

	if [ -n "${UID_CACHE["$NAME"]}" ]
	then
		echo ${UID_CACHE["$NAME"]}
		exit
	fi

	# Get the changesets of the user. This is one of the dirty ways to get the UID of a display-name. Unfortunately there's no good and elegant way.
	# Here we get the first occurrence of the string   uid=... user=...>   and then take the number of e.g.   uid="123456"   and store it in USER_ID.
	USER_ID=$(curl -G --data-urlencode "display_name=$NAME" -s "$URL/api/0.6/changesets" \
		| grep -o " uid=\"[[:digit:]]*\" user" \
		| head -n 1 \
		| grep -o "[[:digit:]]*")

	if [ -z "$USER_ID" ]
	then
		# Try to get username via notes
		USER_ID=$(curl -G --data-urlencode "display_name=$NAME" -s "$URL/api/0.6/notes/search" \
			| grep --color=never "<uid>\|<user>" \
			| tr -d '\n' \
			| sed -r -e "s/<uid>([0-9]*)<\/uid>[ ]*<user>$NAME<\/user>/$\n\1$\n/" \
			| grep -v uid)

		if [ -z "$USER_ID" ]
		then
			USER_ID="-1"
		fi
	fi

	echo $USER_ID
}

# The returned data is something like "2|{user1,user2}" and the usage of "tr" turns it into "2|user1,user2"
PROJECT_DATA=$(psql -h localhost -U postgres -t -A -c "SELECT id,users,owner FROM projects;" stm \
	| tr -d '}' \
	| tr -d '{')

echo "$PROJECT_DATA"
echo
echo

echo "BEGIN TRANSACTION;" > $OUTPUT_FILE

IFS=$'\n'
for ROW in $PROJECT_DATA
do
	IFS='|' read -ra ROW_ARRAY <<< "$ROW"
	IFS=$'\n'

	PROJECT_ID=${ROW_ARRAY[0]}
	USERS_STRING=$(echo ${ROW_ARRAY[1]} | tr -d "\"")
	OWNER_NAME=${ROW_ARRAY[2]}

	echo "====== PROJECT ${ROW_ARRAY[0]} ======"
	echo "Project ID : $PROJECT_ID"
	echo "User names : $USERS_STRING"
	echo "Owner      : $OWNER_NAME"
	echo

	echo "" >> $OUTPUT_FILE
	echo "-- Project: $PROJECT_ID" >> $OUTPUT_FILE

	#
	# Get owners UID
	#

	echo "Get data for owner: $OWNER_NAME"

	OWNER_ID=$(nameToId $OWNER_NAME)
	if [ "$OWNER_ID" == "-1" ]
	then
		echo -e "\e[31mERROR:"
		echo -e "  No UID found for owner '$OWNER_NAME'!"
		echo -e "  Won't migrate this user, so this project will be removed.\e[0m"
		echo

		echo "DELETE FROM tasks USING projects P WHERE P.id='"$PROJECT_ID"' AND tasks.id=ANY(P.task_ids::integer[]);" >> $OUTPUT_FILE
		echo "DELETE FROM projects WHERE id='"$PROJECT_ID"';" >> $OUTPUT_FILE

		continue
	else
		echo "UPDATE projects SET owner='$OWNER_ID' WHERE id='$PROJECT_ID';" >> $OUTPUT_FILE	
	fi

	UID_CACHE["$OWNER_NAME"]="$OWNER_ID"

	echo

	#
	# Get other UIDs
	#

	USER_ID_DB_ARRAY="{"

	IFS=','
	for USER in $USERS_STRING
	do
		echo "Get data for user: $USER"

		USER_ID=$(nameToId "$USER")
		if [ "$USER_ID" == "-1" ]
		then
			echo -e "\e[31mERROR:"
			echo -e "  No UID found for user '$USER'!"
			echo -e "  Won't migrate this user, so this user won't be in this project anymore.\e[0m"
		else
			UID_CACHE["$USER"]="$USER_ID"
			# Buid a comma separated list which is the array representation for the database update statement.
			USER_ID_DB_ARRAY="$USER_ID_DB_ARRAY,$USER_ID"
		fi

		echo
	done

	# Add the closing bracket and turn "{," into "{".
	USER_ID_DB_ARRAY=$(echo "$USER_ID_DB_ARRAY}" | sed "s/^{,/{/g")

	echo "UPDATE projects SET users='$USER_ID_DB_ARRAY' WHERE id='$PROJECT_ID';" >> $OUTPUT_FILE

	echo
done

#
# Also adjust assigned user in tasks
#

# The returned data is something like "2|user1"
TASK_DATA=$(psql -h localhost -U postgres -t -A -c "SELECT id,assigned_user FROM tasks;" stm \
	| grep -v "|$")

echo
echo "===================="
echo
echo "Adjust tasks"
echo
echo "$TASK_DATA"
echo
echo

IFS=$'\n'
for ROW in $TASK_DATA
do
	IFS='|' read -ra ROW_ARRAY <<< "$ROW"
	IFS=$'\n'

	TASK_ID=${ROW_ARRAY[0]}
	USER_STRING=$(echo ${ROW_ARRAY[1]} | tr -d "\"")
	
	echo "====== TASK $TASK_ID ======"
	echo "Task ID       : $TASK_ID"
	echo "Assigned user : $USER_STRING"
	echo

	echo "" >> $OUTPUT_FILE
	echo "-- Task: $TASK_ID" >> $OUTPUT_FILE

	#
	# Get UID
	#

	echo "Get data for assigned user: $USER_STRING"

	USER_ID=$(nameToId $USER_STRING)
	if [ "$USER_ID" == "-1" ]
	then
		echo -e "\e[31mERROR:"
		echo -e "  No UID found for assigned user '$USER_STRING'!"
		echo -e "  Won't migrate this user, so this task will be unassigned.\e[0m"
		echo

		echo "UPDATE tasks SET assigned_user='' WHERE id='"$TASK_ID"';" >> $OUTPUT_FILE

		continue
	else
		echo "UPDATE tasks SET assigned_user='"$USER_ID"' WHERE id='"$TASK_ID"';" >> $OUTPUT_FILE
	fi

	echo
done

#
# Set version
#
echo "INSERT INTO db_versions VALUES('004');" >> $OUTPUT_FILE

#
# Generate the SQL script
#

echo "END TRANSACTION;" >> $OUTPUT_FILE

echo
echo "Execute SQL..."

psql -q -v ON_ERROR_STOP=1 -h localhost -U postgres -f $OUTPUT_FILE stm
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