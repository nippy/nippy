#!/usr/bin/env bash

ROOT_DIR=`dirname $0`
SRC_DIR=${ROOT_DIR}/src
DIST_DIR=${ROOT_DIR}/dist

TSC=$(npm bin)/tsc

VERSION_PREFIX=$(node -p "require('./package.json').version")
VERSION_SUFFIX="-$(git log --oneline 1 | awk '{print $1}')"
VERSION=${VERSION_PREFIX}${VERSION_SUFFIX}
echo "##### BUILDING: Version ${VERSION}"
# Delete dist folder
rm -rf ${DIST_DIR}

#$TSC -p ${SRC_DIR}/tsconfig.json

MODULES=(
	config
)

#for MODULE in "${MODULES[@]}"
#do
#	echo "===== MODULE: ${MODULE}"
#	M=${SRC_DIR}/${MODULE}

	# Compile TS
#	echo "  --- Compiling: ${TSC} -p ${M}/tsconfig.json"
#	$TSC -p ${M}/tsconfig.json

	# Fix package.json
#done
