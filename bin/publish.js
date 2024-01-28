#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const inquirer = require('inquirer')
const shell = require('shelljs')
const util = require('util')
const ora = require('ora')
const chalk = require('chalk')


const loading = ora()

const start = function(msg) {
    loading.text = chalk.blue(msg)
    loading.start()
}
 
const success = function(msg) {
    loading.stopAndPersist({
        symbol: chalk.green('✔'),
        text: chalk.green(msg),
    })
}
const stop = function() {
    loading.stop()
}
const error = function(msg) {
    loading.fail(chalk.red(msg))
}

function resolve (dir) {
    return path.join(__dirname, '..', dir)
}

const readFile = util.promisify(fs.readFile)

const exec = util.promisify(function(cmd, callback) {
    shell.exec(cmd, {silent:true}, function(code, stdout, stderr) {
        if(code === 0) {
            return callback(null, stdout)
        }
        shell.echo(chalk.red(stderr))
        shell.exit()
    })
})
const hasRegistry = process.argv.find(argv => argv.startsWith('--registry'))

const registry = hasRegistry ? hasRegistry.split("=")[1] : 'https://registry.npmjs.org/'

const versionShell = {
    prerelease:'npm version prerelease',  //1.0.0 => 1.0.1-0
    prepatch:'npm version prepatch',    //v1.0.1-1 => v1.0.2-0
    preminor:'npm version preminor',    //v1.0.2-0 => v1.1.0-0
    premajor:'npm version premajor',    //v1.0.2-0 => v2.0.0-0
    patch:'npm version patch',       //v2.0.0-0 => v2.0.0
    minor:'npm version minor',       //v2.0.1 => v2.1.0
    major:'npm version major',       //v2.1.1 => v3.0.0
}
function compareVersion(v1, v2) {
    const version = []
    const state1 = v1.indexOf('-') > -1 ? v1.split('-') : (v1 + '-0').split('-')
    const state2 = v2.indexOf('-') > -1 ? v2.split('-') : (v2 + '-0').split('-')
    let version1 = state1[0].split('.')
    let version2 = state2[0].split('.')
    if(version1.length < 3) version1 = version1.concat('0')
    if(version2.length < 3) version2 = version2.concat('0')

    for(let i = 0; i < version1.length; i++) {
        let str = version2[i]
        if(version1[i] !== version2[i]) {
            str = chalk.green(version2[i])
        }
        version.push(str)
        if(i < 2) {
            version.push('.')
        }
    }
    if(state1[1] !== state2[1]) {
        version.push('-' + chalk.green(state2[1]))
    }

    return version.join('')
}
const versionPrompt = [{
    type: 'list',
    name: 'version',
    message: '请选择需要更新的版本号？（Please choose version number?）',
    choices: Object.keys(versionShell).map(version => version)
}]

const publishingPrompt = [{
    type: 'list',
    name: 'publish',
    message: '是否现在发布？（Publish now?）',
    choices: [{
        name:'是（Yes）',
        value:'y'
    }, {
        name:'否（No）',
        value:'n'
    }]
}]

const confirmPrompt = [{
    type: 'confirm',
    name: 'confirm',
    message: '是否需要自定义Registry?（Custom registry?）',
}]
const registryPrompt = [{
    type: 'input',
    name:'registry',
    message: '输入自定义Registry：(Input custom registry:)',
    validate: (val) => {
        if (/^((https|http|ftp|rtsp|mms)?:\/\/)[^\s]+/g.test(val)) {
          return true;
        }
        return 'Invalid registry url'
    },
}]

const bootstrap = async () => {
    const package = JSON.parse(await readFile(resolve('package.json'), 'utf8'))
    const currentVersion = 'v' + package.version
    const startPrompt = [{
        type: 'list',
        name: 'start',
        message: `是否开始发布代码？（Start publishing code?） Current version: ${currentVersion}`,
        choices: [{
            name:'继续（continue）',
            value:'continue'
        },{
            name:'退出（exit）',
            value:'exit'
        }]
    }]
    const startStep = await inquirer.prompt(startPrompt)

    if(startStep.start === 'exit') {
        return process.exit()
    }
    const versionStep = await inquirer.prompt(versionPrompt)
    if(versionShell[versionStep.version]) {
        start('Start Publish\n')
        const updateVersion = await exec(versionShell[versionStep.version])
        shell.echo(`${currentVersion} => ${compareVersion(currentVersion, updateVersion)}`)
        
        const branch = await exec('git rev-parse --abbrev-ref HEAD')
        shell.echo('Current branch: ' + chalk.green(branch))

        start(`pull current branch\n`)
        const pull = await exec(`git pull origin ${branch}`)
        shell.echo(pull)

        start(`push current branch\n`)
        const push = await exec(`git add . && git push origin ${branch}`)
        success('Success!')

        //发布
        stop()
        const publishStep = await inquirer.prompt(publishingPrompt)
        //npm publish --registry=https://registry.npmjs.org/ 
        // "publicConfig": {
        //     "registry": "https://registry.npmjs.org/"
        // }
        if(publishStep.publish === 'y') {
            const confirmStep = await inquirer.prompt(confirmPrompt)
            if(confirmStep.confirm) {
                const inputStep = await inquirer.prompt(registryPrompt)
                start(`Publishing\n`)
                const publish = await exec(`npm publish --registry=${inputStep.registry}`)
                shell.echo(publish)
                success('\nPublishing success!')
            }else {
                const publish = await exec(`npm publish --registry=${registry}`)
                shell.echo(publish)
                success('\nPublishing success!')
            }
        }
    }
}

bootstrap()
