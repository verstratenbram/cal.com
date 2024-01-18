#!/bin/bash

echo "***********************************************"
echo "*** Fetching latest version from Github... ***"
echo "***********************************************"

if [ -d local/ ]; then
   rm -rf local/
fi

git clone -b webflux --single-branch https://github.com/verstratenbram/cal.com.git local

cd local || exit

cp ../.env-local .env || {
  echo "Error: Failed to copy env";
  exit 1;
}

echo "*************************"
echo "*** Preparing yarn... ***"
echo "*************************"

# check if dependencies got added/updated/removed
yarn install

echo "*******************************"
echo "*** Building the new app... ***"
echo "*******************************"

# make sure to allocate enough memory
export NODE_OPTIONS=--max-old-space-size=10000

# build the new application
yarn build


echo "****************************"
echo "*** Run DB migrations... ***"
echo "****************************"

yarn workspace @calcom/prisma db-deploy

echo "***********************"
echo "*** Starting app... ***"
echo "***********************"

yarn start
