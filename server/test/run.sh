#!/bin/bash

echo "!! WARNING !!"
echo "This script will remove the database folder"
echo
echo "Any key to continue ..."
read

set -e

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
fi

echo "Start new 'stm-db' container"
docker-compose up -d --build stm-db

# Wait until container is up
SLEEP=1
echo "Wait for docker container ($SLEEP s)"
sleep $SLEEP

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
go test -coverprofile=coverage.out -v ./... -args -with-db true
go tool cover -html=coverage.out
