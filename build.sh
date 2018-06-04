#!/bin/bash
# npm config set registry https://registry.npm.taobao.org;
# rm -rf node_modules/ipos-zeus*;
# rm -rf node_modules/air-chain*;
# rm -rf node_modules/ya-ui-vue;
# npm install --unsafe-perm --quiet --no-progress;
node tools/install-deps.js;
node tools/build.js --app-env=$1 --app-name=$2 --api-domain=$3;
