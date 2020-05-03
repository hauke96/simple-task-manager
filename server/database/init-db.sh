#!/bin/bash

function create_db() {
  echo "Create new database 'stm'"
  createdb -h localhost -U postgres stm
  if [ $? -ne 0 ]
  then
    echo
    echo "Errur during database creation."
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
    echo

	  psql -a -v ON_ERROR_STOP=1 -h localhost -U postgres -f $1 stm

	  # Check return value
	  if [ $? -ne 0 ]
	  then
	    echo
      echo "=============================="
	    echo
	    echo "Error during script $1."
	    echo "Abort."
	    exit 1
    fi

    echo
    echo "Ok"
    echo
}

# First check if database exists
psql -h localhost -U postgres -lqt | cut -d \| -f 1 | grep -qw "stm"
DATABASE_EXISTS=$?

# Loop over all relevant files
FILES=$(ls *.sql)
for FILE in $FILES
do
  VERSION=$(echo $FILE | grep --color=never -Po "^[[:digit:]]{3}")

  if [ $DATABASE_EXISTS -ne 0 ] && [ $VERSION -eq "000" ]
  then # Database does not exist and we're looking at the init script => so execute initial script
    create_db
    execute $FILE
  else # Database does exist and we're not looking at the init script => check if this script needs to be executed
    VERSION_ALREADY_APPLIED=$(psql -h localhost -U postgres stm -tc "SELECT * FROM db_versions WHERE version='$VERSION';" | sed '/^$/d' | wc -l)
    if [ $VERSION_ALREADY_APPLIED -eq 0 ]
    then
      execute $FILE
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