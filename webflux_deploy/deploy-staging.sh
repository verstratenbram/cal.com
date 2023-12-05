#!/bin/bash

echo "***********************************************"
echo "*** Fetching latest version from Github... ***"
echo "***********************************************"

git clone -b webflux --single-branch https://github.com/verstratenbram/cal.com.git staging

cd staging || exit

cp ../.env-staging .env

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
echo "*** Yarn cache clear ***"
echo "************************"

#yarn cache clean

echo "************************"
echo "*** Creating archive ***"
echo "************************"

cd ..
gtar czf staging.tar.gz staging

echo "*************************"
echo "*** Uploading archive ***"
echo "*************************"

scp staging.tar.gz ur10293@staging.cal.green.srv.onl:~

echo "*******************"
echo "*** Cleaning up ***"
echo "*******************"

rm -rf staging/
rm staging.tar.gz

echo "************"
echo "*** Done ***"
echo "************"
