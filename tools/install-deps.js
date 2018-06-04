/**
 * 安装依赖
 * 服务端环境推荐yarn(锁版本)
 * 本地环境支持npm安装(npm不锁版本)
 */
const util = require('util');
const fs = require('fs');
const path = require('path');
const packageData = require('../package.json');

// 创建shelljs环境
const devDeps = packageData.devDependencies;
const deps = packageData.dependencies;

prepareShellEnv(() => {
  const shell = require('shelljs');

  const envCommands = [{
    name: 'git',
    version: '--version'
  }, {
    name: 'python',
    version: '--version'
  }, {
    name: 'yarn|npm',
    version: '-v|-v'
  }]; 

  let preferInstallCommand = ''; // yarn or npm

  envCommands.some((command) => {
    const names = command.name.split('|');
    const versions = command.version.split('|');
    if (!names.some((name, i) => {
      const isTrue = shell.which(name);
      if (isTrue) {
        let version = shell.exec(`${name} ${versions[i]}`, { silent: true });
        if (name === 'python') {
          if (!version.toString()) {
            version = version.stderr;
          }
        }
        shell.echo(`${name}: ${version}`);
      }
      if ((name === 'yarn' || name === 'npm') && !preferInstallCommand) {
        preferInstallCommand = name;
      }
      return isTrue;
    })) {
      const namesStr = names.join(' or ');
      shell.echo(`Sorry, this script requires ${namesStr}, please install it first and put it on environment path`);
      shell.exit(1);
      return;
    }
  });
  const upgradeDeps = Object.keys(deps).filter((key) => {
    return key.slice(0, 9) === 'air-chain' || key.slice(0, 9) === 'ipos-zeus';
  });
  // npm安装先清理依赖
  if (preferInstallCommand === 'npm') {
    upgradeDeps.forEach((dep) => {
      shell.rm('-rf', 'node_modules/' + dep);
    });
  }
  // 清理可能存在的package-lock.json(历史原因，以前没考虑锁版本问题)
  shell.rm('-rf', 'package-lock.json');

  let exeCommands = [
    `${preferInstallCommand} install`
  ];
  if (preferInstallCommand === 'yarn') {
    exeCommands.concat(upgradeDeps.map((dep) => {
      if (preferInstallCommand === 'yarn') {
        return `yarn upgrade ${dep}`;
      }
    }));
    exeCommands.push('yarn upgrade ya-ui-vue');
  }
  // 按序执行
  for (let i = 0; i < exeCommands.length; i++) {
    const exp = exeCommands[i];
    const code = shell.exec(exp).code;
    if (code !== 0) {
      shell.exit(1);
      break;
    }
  }
  // warn third ui component version compatibility
  const thirdUiComponents = [{
    name: '@antv/data-set'
  }, {
    name: '@antv/f2'
  }, {
    name: '@antv/g2'
  }, {
    name: '@antv/g6'
  }, {
    name: 'antd'
  }, {
    name: 'antd-mobile'
  }, {
    name: 'element-ui'
  }, {
    name: 'inmap'
  }, {
    name: 'iview'
  }, {
    name: 'mint-ui'
  }];
  const yaUiVuePackageData = require('ya-ui-vue/package.json');
  const yaUiVueDeps = yaUiVuePackageData.dependencies;
  // 挨个验证
  thirdUiComponents.forEach((item) => {
    const name = item.name;
    const realVersion = require(`${name}/package.json`).version;
    if (deps[name] && realVersion !== yaUiVueDeps[name]) {
      console.warn(`${name} current version is ${realVersion}, the recommend version should be ${yaUiVueDeps[name]}`);
    }
  });
});



/**
 * 准备环境
 */
async function prepareShellEnv(callback) {
  const isShellReady = fs.existsSync(path.resolve(__dirname, '../node_modules/shelljs'));
  if (!isShellReady) {
    const exec = util.promisify(require('child_process').exec);
    const shellVersion = devDeps.shelljs;
    const packageJson = path.resolve(__dirname, '../package.json');
    const packageBak = path.resolve(__dirname, '../package.bak');
    // backup package.json
    fs.renameSync(packageJson, packageBak);
    try {
      const result = await exec(`yarn add shelljs@${shellVersion} --dev`);
      fs.renameSync(packageBak, packageJson);
      if (!result.stderr) {
        console.log(result.stdout);
        callback();
      } else {
        console.error(result.stderr);
        secondTry();
      }
    } catch(evt) {
      console.error(evt.stderr);
      fs.renameSync(packageBak, packageJson);
      secondTry();
    }
    async function secondTry() {
      try {
        const result = await exec(`npm install shelljs@${shellVersion} --save-exact`);
        if (!result.stderr) {
          // fs.renameSync(packageBak, packageJson);
          callback();
        } else {
          console.error(result.stderr);
        }
      } catch(evt) {
        console.error(evt.stderr);
      }
    }
  } else {
    callback();
  }
}


