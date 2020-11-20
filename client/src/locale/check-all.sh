#!/bin/bash

ALL_LANG_CODES=$(ls *.xlf | grep --color=never "messages\..*\.xlf" | sed "s/messages.\(.*\).xlf/\1/g" | tr "\n" " ")

echo "Language codes to check: $(echo $ALL_LANG_CODES | sed 's/ /, /g')"

for LANG in $ALL_LANG_CODES
do
	echo
	echo "==============="
	echo " Check '$LANG'"
	echo "==============="
	./check.sh "$LANG"
done
