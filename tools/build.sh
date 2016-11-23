#!/usr/bin/env bash

TOOLS_DIR=`dirname $0`
ROOT_DIR=$TOOLS_DIR/..
MODULES_DIR=$ROOT_DIR/modules

TSC=$(npm bin)/tsc

MODULES=(
	config
)

for MODULE in ${MODULES[@]}
do
	echo "===== MODULE: ${MODULE}"
	M=${MODULES_DIR}/${MODULE}

	# Compile TS
	echo "  --- Compiling: ${TSC} -p ${M}/tsconfig.json"
	$TSC -p ${M}/tsconfig.json

	# Fix package.json
done
