#!/bin/bash
npm config set registry https://registry.npm.taobao.org;
rm -rf node_modules/ipos-zeus*;
rm -rf node_modules/ya-ui-vue;
npm install;
node tools/build.js;
