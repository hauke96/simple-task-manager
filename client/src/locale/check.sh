#/bin/bash

# Shows the difference in the translation units from messages.xlf and the given
# file specified by the lang-code (ja, de, ...).

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

# Read and check lang-code parameter
LANG_CODE="$1"
if [ -z "$LANG_CODE" ]
then
	echo "ERROR: Language code (ja, de, ...) must be specified!"
	exit 1
fi

LANG_FILE="messages.$LANG_CODE.xlf"

# Generate units files:
generate_unit_files "$LANG_FILE"
generate_unit_files "messages.xlf"

# Compare these files:
DIFF=$(diff messages.xlf.units messages.$LANG_CODE.xlf.units)

# Missing units
MISSING=$(echo "$DIFF" | grep "^<" | sed "s/< \(.*\)/    \1/g")
if [ -n "$MISSING" ]
then
	echo "Missing in $LANG_FILE:"
	echo "$MISSING"
	echo
fi

REMOVE=$(echo "$DIFF" | grep "^>" | sed "s/> \(.*\)/    \1/g")
if [ -n "$REMOVE" ]
then
	echo "Can be removed from $LANG_FILE:"
	echo "$REMOVE"
fi

if [ -z "$MISSING" ] && [ -z "$REMOVE" ]
then
	echo "Units looking good, nothing to do."
fi
