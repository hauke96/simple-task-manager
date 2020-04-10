#!/bin/bash

echo "!! WARNING !!"
echo "This script will remove the database folder"
echo
echo "Any key to continue ..."
read

set -e

# Switch to root dir where the docker-compose.yml and postgres-data is
cd ../../

echo "Remove 'postgres-data' folder"
sudo rm -rf postgres-data

echo "Stop and remove 'stm-db' docker container and start new one"
docker stop stm-db
docker rm stm-db
docker-compose up -d stm-db

# Wait until container is up
echo "Wait for docker container (5s)"
sleep 5

echo "Initialize new database"
cd server/database
./init-db.sh

echo "Fill database with dummy data"
cd ../test
psql -h localhost -U postgres -f dump.sql stm

echo "Execute tests"
echo
cd ..
go test -coverprofile=coverage.out -v ./... -args -with-db true
go tool cover -html=coverage.out
