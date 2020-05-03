#!/bin/bash

# Exit on errors
set -e

# First parameter must be tag name
if [ -z $1 ]
then
  echo "ERROR: Specify tag name:"
  echo
  echo "    ./build-base-image.sh \"0.8.0-dev\""
  exit 1
fi

docker-compose build stm-client-base
docker tag simple-task-manager_stm-client-base simpletaskmanager/stm-client-base:$1

echo
echo "Finished building. Push with:"
echo
echo "    docker push simpletaskmanager/stm-client-base:$1"
