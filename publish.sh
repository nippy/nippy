#!/usr/bin/env bash

set -e -o pipefail
cd `dirname $0`

TAG=$1

if [[ "${TAG}" == "" ]]; then
	TAG="next"
fi

if [[ "${TAG}" == "release" ]]; then
	TAG="latest"
fi

if [[ "${TAG}" != "next" && "${TAG}" != "latest" ]]; then
	echo "Release tag '${TAG}' is invalid. Use 'next' or 'latest/release'."
	exit 1
fi

./build.sh

echo ""
echo "##### PUBLISHING"

cd ./dist/packages-dist

if [[ "${TAG}" == "latest" ]]; then
	VERSION_SUFFIX="-$(git log --oneline --color=never -1 | awk '{print $1}')"
	find . -type f -name package.json -print0 | xargs -0 sed -i "s/${VERSION_SUFFIX}//g"
fi

for PACKAGE in *; do
	if [[ -d ${PACKAGE} ]]; then
		echo "===== npm publish ${PACKAGE} --access public --tag ${TAG}"
		npm publish ./${PACKAGE} --access public --tag ${TAG}
	fi
done
