#!/bin/bash

# Some logging to see how long building an deployment takes plus the deployment itself.

clear
date
echo -e "\n\n\n"

docker-compose down
docker-compose up -d --build

echo -e "\n\n\n"
date
