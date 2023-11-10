#!/bin/bash

set -e

SLEEP=3

function wait()
{
	echo "Wait... ($SLEEP s)"
	sleep $SLEEP
}

echo "!! WARNING !!"
echo "This script will remove the database folder"
echo
echo "Any key to continue ..."
read

# If container "stm-db" exists, stop and remove it
if docker container list | grep -q "stm-db"
then
	echo "Remove existing database"
	psql -h $STM_DB_HOST -U $STM_DB_USERNAME postgres -tc "DROP DATABASE stm;"
else
	cd ../../
	echo "Start new 'stm-db' container"
	docker-compose up -d --build stm-db
	wait
	cd server/test/
fi

echo "Initialize new database"
cd ../database
./init-db.sh

# Switch from "./server/database" into "./server" folder
cd ..
echo "Execute tests"
echo

# go test github.com/hauke96/simple-task-manager/server/permission -coverprofile=coverage.out -v ./... -args -with-db true | tee test.log
go test -p 1 -coverprofile=coverage.out -v ./... | tee test.log

# Show failed functions with file and line number. This makes it a bit easier to find them.
echo
echo
if cat test.log | grep -i -q "fail"
then
	echo "Failed tests:"
	FAILED_FUNCTIONS=$(cat test.log | grep "FAIL:" | grep -o " [a-zA-Z0-9_]* " | sed 's/ //g' | tr '\n' ' ')
	for FUNC in $FAILED_FUNCTIONS
	do
		FUNC_DEF=$(grep --color=never -Hrn "$FUNC" | grep -o --color=never "[a-zA-Z\./_]*\.go:[[:digit:]]*:func $FUNC")
		echo "    - $FUNC    " | tr -d '\n'
		echo $FUNC_DEF | grep -o --color=never "[a-zA-Z\./_]*\.go" | tr -d '\n'
		echo " : " | tr -d '\n'
		echo $FUNC_DEF | grep -o --color=never "[[:digit:]]*"
	done
else
	echo "PASSED"
fi
echo
echo

rm -f test.log

echo "Open coverage with:"
echo
echo "    go tool cover -html=../coverage.out"
echo
