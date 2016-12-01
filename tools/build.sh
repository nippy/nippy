#!/usr/bin/env bash

TOOLS_DIR=`dirname $0`
ROOT_DIR=$TOOLS_DIR/..
SRC_DIR=$ROOT_DIR/src

TSC=$(npm bin)/tsc

MODULES=(
	config
)

$TSC -p ${SRC_DIR}/tsconfig.json

#for MODULE in ${MODULES[@]}
#do
#	echo "===== MODULE: ${MODULE}"
#	M=${SRC_DIR}/${MODULE}

	# Compile TS
#	echo "  --- Compiling: ${TSC} -p ${M}/tsconfig.json"
#	$TSC -p ${M}/tsconfig.json

	# Fix package.json
#done
