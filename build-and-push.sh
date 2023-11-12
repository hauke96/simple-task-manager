#!/bin/bash

# Exit on errors
set -e

# First parameter must be tag name
if [ -z $1 ]
then
	echo "ERROR: Specify tag name."
	echo
	echo "Example:"
	echo
	echo "    $(basename $0) \"0.8.0-dev\""
	exit 1
fi
TAG=$1

function ok {
	echo
	echo "OK"
}

function hline {
	echo
	printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' =
	echo " $1"
	printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' =
	echo
}

hline "[1/4] Build server"
docker buildx build --progress=plain -t simpletaskmanager/stm-server:$TAG server
ok

hline "[2/4] Build Client"
echo "This step might take a while..."
echo
docker buildx build --progress=plain -t simpletaskmanager/stm-client:$TAG client
ok

hline "[3/4] Push server"
docker push simpletaskmanager/stm-server:$TAG
ok

hline "[4/4] Push client"
docker push simpletaskmanager/stm-client:$TAG
ok

echo
printf '%*s\n' "${COLUMNS:-$(tput cols)}" '' | tr ' ' =
echo
echo "DONE"