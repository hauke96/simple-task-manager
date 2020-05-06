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

# Switch to "./" (root folder of repo) where the docker-compose.yml and postgres-data is
cd ../../

echo "Remove 'postgres-data' folder"
sudo rm -rf postgres-data

# If container "stm-db" exists, stop and remove it
if docker container list | grep -q "stm-db"
then
	echo "Stop and remove container 'stm-db'"
	docker stop stm-db
	docker rm -f stm-db
	wait
fi

echo "Start new 'stm-db' container"
docker-compose up -d --build stm-db

# Wait until container is up
wait

echo "Initialize new database"
cd server/database
./init-db.sh

echo "Fill database with dummy data"
# Switch from "./server/database" into "./server/test"
cd ../test
psql -h localhost -U postgres -f dump.sql stm

# Go into ./server folder
cd ..
echo "Execute tests"
echo

# go test github.com/hauke96/simple-task-manager/server/permission -coverprofile=coverage.out -v ./... -args -with-db true | tee test.log
go test -coverprofile=coverage.out -v ./... | tee test.log

# Show failed functions with file and line number. This makes it a bit easier to find them.
echo
echo
if cat test.log | grep -q "FAIL:"
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
