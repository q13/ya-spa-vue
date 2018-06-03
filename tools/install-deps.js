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
  console.log(2222);

  envCommands.some((command) => {
    const names = command.name.split('|');
    const versions = command.version.split('|');
    if (!names.some((name, i) => {
      const isTrue = shell.which(name);
      if (isTrue) {
        const version = shell.exec(`${name} ${versions[i]}`, { silent: true });
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
  const deps = packageData.dependencies;
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
});

/**
 * 准备环境
 */
async function prepareShellEnv(callback) {
  const isShellReady = fs.existsSync(path.resolve(__dirname, '../node_modules/shelljs'));
  if (!isShellReady) {
    const exec = util.promisify(require('child_process').exec);
    const shellVersion = devDeps.shelljs;
    console.log('aaa', shellVersion);
    console.log(`yarn add shelljs@${shellVersion} --dev`);
    const packageJson = path.resolve(__dirname, '../package.json');
    const packageBak = path.resolve(__dirname, '../package.bak');
    // backup package.json
    fs.renameSync(packageJson, packageBak);
    try {
      const result = await exec(`yarn add shelljs@${shellVersion} --dev`);
      if (!result.stderr) {
        console.log(888);
        console.log(result.stdout);
        fs.renameSync(packageBak, packageJson);
        callback();
      } else {
        console.log(123);
        console.error(result.stderr);
        console.log(234, result);
        secondTry();
      }
    } catch(evt) {
      console.error(evt.stderr);
      console.log(999);
      secondTry();
    }
    async function secondTry() {
      try {
        const result = await exec(`npm install shelljs@${shellVersion}`);
        if (!result.stderr) {
          fs.renameSync(packageBak, packageJson);
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


