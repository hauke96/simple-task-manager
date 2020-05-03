#!/bin/bash

# Some logging to see how long building an deployment takes plus the deployment itself.

clear
date
echo -e "\n\n\n"

# We don't want to build and run "stm-client-base" as that comes from the docker hub.
docker-compose up -d --build stm-db stm-server stm-client

echo -e "\n\n\n"
date
