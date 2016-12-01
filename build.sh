#!/usr/bin/env bash

set -e -o pipefail
cd `dirname $0`

TSC=$(npm bin)/tsc

VERSION_PREFIX=$(node -p "require('./package.json').version")
VERSION_SUFFIX="-$(git log --oneline --color=never -1 | awk '{print $1}')"
VERSION=${VERSION_PREFIX}${VERSION_SUFFIX}

echo "##### BUILDING: Version ${VERSION}"
rm -rf ./dist/

echo "===== ALL:"
echo "    - Compiling: \$(npm bin)/tsc -p ./src/tsconfig.json"
$TSC -p ./src/tsconfig.json

MODULES=(
	config
	core
	gulp
	logger
)

for MODULE in "${MODULES[@]}"
do
	echo "===== MODULE: ${MODULE}"
	SRC_DIR=./src/${MODULE}
	DEST_DIR=./dist/packages-dist/${MODULE}

	echo "    - Compiling: \$(npm bin)/tsc -p ${SRC_DIR}/tsconfig-build.json"
	$TSC -p ${SRC_DIR}/tsconfig-build.json

	echo "    - Copying static files"
	cp ${SRC_DIR}/package.json ${DEST_DIR}/
	cp ./LICENSE ${DEST_DIR}/
	cp ./README.md ${DEST_DIR}/ # TODO: Use module readme if found.
done

echo "===== Replacing placeholders"
AUTHOR=$(node -p "require('./package.json').author" | sed -e 's/[\/&]/\\&/g')
LICENSE=$(node -p "require('./package.json').license")
REPO_URL=$(node -p "require('./package.json').repository.url" | sed -e 's/[\/&]/\\&/g')
find ./dist/packages-dist/ -type f -name package.json -print0 | xargs -0 sed -i "s/PLACEHOLDER-VERSION/${VERSION_PREFIX}/g"
find ./dist/packages-dist/ -type f -name package.json -print0 | xargs -0 sed -i "s/PLACEHOLDER-AUTHOR/${AUTHOR}/g"
find ./dist/packages-dist/ -type f -name package.json -print0 | xargs -0 sed -i "s/PLACEHOLDER-LICENSE/${LICENSE}/g"
find ./dist/packages-dist/ -type f -name package.json -print0 | xargs -0 sed -i "s/PLACEHOLDER-REPO-URL/${REPO_URL}/g"

echo "##### DONE"
