#!/bin/bash

# Some logging to see how long building an deployment takes plus the deployment itself.

echo -n "OAuth consumer key: "
read OAUTH_CONSUMER_KEY_INPUT

echo -n "OAuth secret: "
read -s OAUTH_SECRET_INPUT
echo

export OAUTH_CONSUMER_KEY=$OAUTH_CONSUMER_KEY_INPUT
export OAUTH_SECRET=$OAUTH_SECRET_INPUT

clear
date
echo -e "\n\n\n"

# We don't want to build and run "stm-client-base" as that comes from the docker hub.
docker-compose up -d --build stm-db stm-server stm-client

echo -e "\n\n\n"
date
