#!/bin/bash
npm config set registry https://registry.npm.taobao.org;
rm -rf node_modules/ipos-zeus*;
npm install;
node tools/build.js;
