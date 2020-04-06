#!/bin/bash

FILES=$(ls *.sql)

createdb -h localhost -U postgres stm

for FILE in $FILES
do
	psql -h localhost -U postgres -f $FILE stm
done
