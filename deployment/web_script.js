'use strict';

var request = require('request');

var token = require('../secret_token');

var deployLogs = [];

function changeDeploymentState (deploymentId, state, callback) {
    var requestOption = {
        url: 'https://api.github.com/repos/wakaid/axist-client/deployments/' + deploymentId + '/statuses?access_token=' + token,
        method: 'POST',
        headers: {
            'User-Agent': 'Awesome-Wakaid-App'
        },
        json: {
            state: state,
            description: 'Deployment ' + state + '.'
        } 
    };

    request(requestOption, callback);
}

function changeCommitState (sha, state, callback) {
    var requestOption = {
        url: 'https://api.github.com/repos/wakaid/axist-client/statuses/' + sha + '?access_token=' + token,
        method: 'POST',
        headers: {
            'User-Agent': 'Awesome-Wakaid-App'
        },
        json: {
            state: state,
            description: 'Deployment ' + state + '.'
        } 
    };

    request(requestOption, callback);
}

module.exports = function(deploymentId, sha) {
    var spawn = require('child_process').spawn;
    var child = spawn('cd ../axist-client && git pull origin production && npm install && npm update && npm install -g forever grunt react-scripts && forever stop web && forever start --id "web" -c "npm start" ./', {
        shell: true
    });

    child.stderr.on('data', function (data) {
        deployLogs.push(data.toString());
    });

    child.stdout.on('data', function (data) {
        deployLogs.push(data.toString());
    });

    child.on('exit', function (exitCode) {
        if (exitCode !== 0) {
            deployLogs.push('deploy failed with code: ' + exitCode);
            changeDeploymentState(deploymentId, 'failure', function (err, response, body) {
                if (err) {
                    throw err;
                }

                changeCommitState(sha, 'failure', function(err, response, body) {
                    if (err) {
                        throw err;
                    }
                });
            });
        }

        changeDeploymentState(deploymentId, 'success', function (err, response, body) {
            if (err) {
                throw err;
            }

            changeCommitState(sha, 'success', function(err, response, body) {
                if (err) {
                    throw err;
                }

                deployLogs.push('deploy success! :)');

                console.log('deploy success! :)');
            });
        });
    });
};