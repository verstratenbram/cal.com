#!/bin/bash

echo "***********************************************"
echo "*** Fetching latest version from Github... ***"
echo "***********************************************"

git clone -b webflux --single-branch https://github.com/verstratenbram/cal.com.git production

cd production || exit

cp ../.env-production .env || {
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

echo "************************"
echo "*** Creating archive ***"
echo "************************"

cd ..
gtar czf production.tar.gz production

echo "*************************"
echo "*** Uploading archive ***"
echo "*************************"

scp production.tar.gz ur10259@cal.mijnafspraken.online:~

echo "*******************"
echo "*** Cleaning up ***"
echo "*******************"

rm -rf production/
rm production.tar.gz

echo "************"
echo "*** Done ***"
echo "************"
