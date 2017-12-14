#!/bin/bash
npm config set registry https://registry.npm.taobao.org;
npm install;
node tools/build.js;
