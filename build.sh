#!/usr/bin/env bash

set -e -o pipefail

cd `dirname $0`
SRC_DIR=./src
DIST_DIR=./dist

TSC=$(npm bin)/tsc

VERSION_PREFIX=$(node -p "require('./package.json').version")
VERSION_SUFFIX="-$(git log --oneline --color=never -1 | awk '{print $1}')"
VERSION=${VERSION_PREFIX}${VERSION_SUFFIX}

echo "##### BUILDING: Version ${VERSION}"

# Delete dist folder
rm -rf ${DIST_DIR}

# Compile all source
echo "===== ALL:"
echo "    - Compiling: \$(npm bin)/tsc -p ${SRC_DIR}/tsconfig.json"
$TSC -p ${SRC_DIR}/tsconfig.json

MODULES=(
	config
	core
	gulp
	logger
)

for MODULE in "${MODULES[@]}"
do
	echo "===== MODULE: ${MODULE}"
	MODULE_DIR=${SRC_DIR}/${MODULE}
	DEST_DIR=${DIST_DIR}/package-dist/${MODULE}

	# Compile TS
	echo "    - Compiling: \$(npm bin)/tsc -p ${SRC_DIR}/tsconfig-build.json"
	$TSC -p ${MODULE_DIR}/tsconfig-build.json

	# Copy static files
	cp ${MODULE_DIR}/package.json ${DEST_DIR}/
	cp ./LICENSE ${DEST_DIR}/
	cp ./README.md ${DEST_DIR}/ # TODO: Use module readme if found.
done
