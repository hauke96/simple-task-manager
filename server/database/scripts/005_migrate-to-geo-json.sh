#!/bin/bash

OUTPUT_FILE=".tmp.migrate-task-geometries.sql"

# The current stored coordinate list comes in between these strings and BOOM we have some GeoJSON to store :)
# This GeoJSON format is exactly the same as the OpenLayers class "format.GeoJson" output for a feature. I actually
# copied these strings from that class output.
GEOJSON_HEAD="{\"type\":\"Feature\",\"geometry\":{\"type\":\"Polygon\",\"coordinates\":["
GEOJSON_FOOT="]},\"properties\":null}"

RAW_DATA=$(psql -h localhost -U postgres -t -A -c "SELECT id,geometry FROM tasks;" stm)

echo "BEGIN TRANSACTION;" > $OUTPUT_FILE

IFS=$'\n'
for ROW in $RAW_DATA
do
	IFS='|' read -ra ROW_ARRAY <<< "$ROW"
	IFS=$'\n'

	TASK_ID=${ROW_ARRAY[0]}
	ORIGINAL_GEOMETRY=${ROW_ARRAY[1]}

	echo "====== TASK $TASK_ID ======"
	echo "Task ID       : $TASK_ID"
	echo "Geometry      : $ORIGINAL_GEOMETRY"
	echo

	echo "" >> $OUTPUT_FILE
	echo "-- Task: $TASK_ID" >> $OUTPUT_FILE

	GEOJSON_GEOMETRY="$GEOJSON_HEAD$ORIGINAL_GEOMETRY$GEOJSON_FOOT"
	echo "$GEOJSON_GEOMETRY"
	echo

	echo "UPDATE tasks SET geometry='$GEOJSON_GEOMETRY' WHERE id='$TASK_ID';" >> $OUTPUT_FILE
done

#
# Set version
#
echo "INSERT INTO db_versions VALUES('005');" >> $OUTPUT_FILE

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

#echo "Remove '$OUTPUT_FILE'"
#rm $OUTPUT_FILE