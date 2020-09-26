#!/bin/bash

# Exit on errors
set -e

for (( i=1; i<=$#; i++ ))
do
  arg=${@:$i:1}   # Gets the string i
	val=${@:$i+1:1} # Gets the string i+1

	case $arg in
	-h|--help)
		HELP=true
		;;
	-e|--env)
		ASK_ENV=true
		;;
	-t|--test)
		TEST=true
		;;
	*)
		echo "Unknown argument number $i: '$arg'"
		;;
	esac
done

if [ $HELP ]
then
  cat <<END
Helper script to deploy the simple task manager.

Usages: ./deploy.sh [args...]

Arguments:
    (none)        If no argument is specified, the simple task manager is deployed in production mode.
    -h, --help    Displays this message.
    -t, --test    Deployment for test server, this uses different configs for the stm-test.hauke-stieler.de domain.
    -e, --env     Asks for important environment veriables (e.g. database credentials)
END
  exit 0
fi

if [ $ASK_ENV ]
then
  echo -n "OAuth consumer key: "
  read OAUTH_CONSUMER_KEY_INPUT

  echo -n "OAuth secret: "
  read -s OAUTH_SECRET_INPUT
  echo

  echo -n "Database username: "
  read STM_DB_USERNAME_INPUT

  echo -n "Database password: "
  read -s STM_DB_PASSWORD_INPUT
  echo

  export OAUTH_CONSUMER_KEY=$OAUTH_CONSUMER_KEY_INPUT
  export OAUTH_SECRET=$OAUTH_SECRET_INPUT
  export STM_DB_USERNAME=$STM_DB_USERNAME_INPUT
  export STM_DB_PASSWORD=$STM_DB_PASSWORD_INPUT
fi

# For logging to see how long building an deployment takes
START_DATE=$(date)

# The "stm-base" image is not build because it comes pre-built from the docker hub
docker-compose down
if [ $TEST ]
then
  echo "Use test configs"
  docker-compose -f docker-compose.test.yml up -d --build stm-db stm-server-test stm-client-test
else
  echo "Use prod configs"
  docker-compose up -d --build stm-db stm-server stm-client
fi

# Print the start and end-date to see how long everything took
echo -e "\n\n\n"
echo "Start: $START_DATE"
echo "End  : $(date)"
