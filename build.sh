#!/bin/bash
# npm config set registry https://registry.npm.taobao.org;
# rm -rf node_modules/ipos-zeus*;
# rm -rf node_modules/air-chain*;
# rm -rf node_modules/ya-ui-vue;
# npm install --unsafe-perm --quiet --no-progress;
node tools/install-deps.js;
UV_THREADPOOL_SIZE=100 node --max_old_space_size=8192 tools/build.js --app-env=$1 --app-name=$2 --api-domain=$3;
