#!/bin/bash

# Global constants
SCRIPT_PREFIX="./scripts/"

function create_db() {
  echo "Create new database 'stm'"

  createdb -h localhost -U $STM_DB_USERNAME stm

  if [ $? -ne 0 ]
  then
    echo
    echo "Error during database creation."
    echo "Abort."
    exit 1
  fi

  echo
  echo "Ok"
  echo
}

function execute() {
    echo "=============================="
    echo
    echo "Execute file: $1"

    # Check what script-type we have (actually what file extension the script has) and execute the script accordingly
    if [[ "$1" == *".sql" ]]
    then
  	  psql -q -v ON_ERROR_STOP=1 -h localhost -U $STM_DB_USERNAME -f $1 stm
  	  OK=$?
    elif [[ "$1" == *".sh" ]]
    then
      $1
      OK=$?
    fi

	  # Check return value
	  if [ $OK -ne 0 ]
	  then
	    echo
	    echo "Error during script $1"
	    echo "Abort."
	    exit 1
    fi

    echo
    echo "Ok"
    echo
}

# First check if database exists
psql -h localhost -U $STM_DB_USERNAME -lqt | cut -d \| -f 1 | grep -qw "stm"
DATABASE_EXISTS=$?

# Loop over all relevant files
FILES=$(ls $SCRIPT_PREFIX | tr " " "\n" | grep --color=never -P "^[[:digit:]]{3}" | tr "\n" " ")

for FILE in $FILES
do
  VERSION=$(echo $FILE | grep --color=never -Po "^[[:digit:]]{3}")

  if [ $DATABASE_EXISTS -ne 0 ] && [ "$VERSION" == "000" ]
  then # Database does not exist and we're looking at the init script => so execute initial script
    create_db
    execute $SCRIPT_PREFIX$FILE
  else # Database does exist and we're not looking at the init script => check if this script needs to be executed
    VERSION_ALREADY_APPLIED=$(psql -h localhost -U $STM_DB_USERNAME stm -tc "SELECT * FROM db_versions WHERE version='$VERSION';" | sed '/^$/d' | wc -l)
    if [ $VERSION_ALREADY_APPLIED -eq 0 ]
    then
      execute $SCRIPT_PREFIX$FILE
    else
      echo "=============================="
      echo
      echo "Skip $VERSION: File $FILE already applied"
      echo
    fi
  fi
done

echo "=============================="
echo
echo "Done."