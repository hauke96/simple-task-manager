#!/bin/bash

function generate_unit_files() {
	# Check language file that should be checked
	FILE="$1"
	if [ ! -f $FILE ]
	then
		echo "ERROR: Language file '$FILE' does not exist!"
		exit 1
	fi

	OUTPUT_FILE="$FILE.units"
	cat $FILE | grep --color=never "trans-unit " | sed 's/.*id="\(.*\)" .*/\1/g' | sort > $OUTPUT_FILE
}

# Checks for missing translation units: Those which can be removed (exist in
# the translated file but not in the source file) and those missing in the
# translated file.
function check_missing_entries()
{
	# Read and check lang-code parameter
	LANG_CODE="$1"
	if [ -z "$LANG_CODE" ]
	then
		echo "ERROR: Language code (ja, de, ...) must be specified!"
		exit 1
	fi

	echo "Search for units out of sync"
	
	LANG_FILE="messages.$LANG_CODE.xlf"
	
	# Generate units files:
	generate_unit_files "$LANG_FILE"
	generate_unit_files "messages.xlf"
	
	# Compare these files:
	DIFF=$(diff messages.xlf.units messages.$LANG_CODE.xlf.units)
	
	# Missing units
	MISSING=$(echo "$DIFF" | grep "^<" | sed "s/< \(.*\)/  \1/g")
	if [ -n "$MISSING" ]
	then
		echo "Missing in $LANG_FILE:"
		echo
		echo "$MISSING"
		echo
	fi
	
	# Units which are in the translated file but not in the source file anymore.
	REMOVE=$(echo "$DIFF" | grep "^>" | sed "s/> \(.*\)/  \1/g")
	if [ -n "$REMOVE" ]
	then
		echo "Can be removed from $LANG_FILE:"
		echo
		echo "$REMOVE"
	fi
	
	if [ -z "$MISSING" ] && [ -z "$REMOVE" ]
	then
		echo "All translation units in sync, nothing to do."
	fi
}

# Searches for untranslated units. A unit is untranslated when source and target
# strings are equals AND the state argument is either missing or not in the
# state 'translated'.
function check_untranslated_units()
{
	# Read and check lang-code parameter
	LANG_CODE="$1"
	if [ -z "$LANG_CODE" ]
	then
		echo "ERROR: Language code (ja, de, ...) must be specified!"
		exit 1
	fi

	echo "Search for untranslated units"
	
	LANG_FILE="messages.$LANG_CODE.xlf"
	UNITS=$(cat "$LANG_FILE" | tr -d "\\n" | sed "s/<\/trans-unit>/<trans-unit>\n/g")

	IFS='
'
	for UNIT in $UNITS
	do
		UNIT_SOURCE=$(echo $UNIT | grep --color=never -oP "<source.*>(.*?)</source>" | sed "s/<source>\(.*\)<\/source>/\1/g")
		UNIT_TARGET=$(echo $UNIT | grep --color=never -oP "<target.*>(.*?)</target>" | sed "s/<target[^>]*>\(.*\)<\/target>/\1/g")

		if [ -n "$UNIT_SOURCE" ] && [ "$UNIT_SOURCE" = "$UNIT_TARGET" ] && ! echo $UNIT | grep -q "state=\"translated\""
		then
			# First entry -> print newline
			if [ -z $UNIT_ID ]
			then
				echo
			fi

			UNIT_ID=$(echo "$UNIT" | grep --color=never -oP "<trans-unit id=\"(.*?)\" " | sed "s/<trans-unit id=\"//g" | sed "s/\"//g")
			echo "  $UNIT_ID"
		fi
	done

	# Check if w found an untranslated unit (when we don't have an ID)
	if [ -z "$UNIT_ID" ]
	then
		echo "All units translated, nothing to do."
	fi

	# Reset variable for future runs
	UNIT_ID=""

	IFS=' '
}

ALL_LANG_CODES=$(ls *.xlf | grep --color=never "messages\..*\.xlf" | sed "s/messages.\(.*\).xlf/\1/g" | tr "\n" " ")

echo "Language codes to check: $(echo $ALL_LANG_CODES | sed 's/ /, /g')"

for LANG in $ALL_LANG_CODES
do
	echo
	echo "==============="
	echo " Check '$LANG'"
	echo "==============="
	echo
	check_missing_entries "$LANG"

	echo
	echo "----"
	echo

	check_untranslated_units "$LANG"
done
