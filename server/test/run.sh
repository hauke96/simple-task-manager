#!/bin/bash

echo "!! WARNING !!"
echo "This script will remove the database folder"
echo
echo "  CTRL+C:        cancel"
echo "  Any other key: continue"
read

set -e

# Switch to root dir where the docker-compose.yml and postgres-data is
cd ../../
pwd

sudo rm -rf postgres-data

docker stop stm-db
docker rm stm-db
docker-compose up -d stm-db

# Wait until container is up
echo "Wait for docker container (5s)"
sleep 5

cd server/database
pwd
./init-db.sh

cd ../test
pwd
psql -h localhost -U postgres -f dump.sql stm

cd ..
pwd
go test -coverprofile=coverage.out -v ./... -args -with-db true
go tool cover -html=coverage.out
