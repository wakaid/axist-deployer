'use strict';

var express = require('express');
var request = require('request');

var deployServer = require('./deployment/server_script');
var deployWeb = require('./deployment/web_script');
var token = require('./secret_token');

const AXIST_SERVER = 'axist-server';
const AXIST_WEB = 'axist-client';

var app = express();

function createDeploymentRequest (repo, callback) {
    var requestOption = {
        url: 'https://api.github.com/repos/wakaid/' + repo + '/deployments?access_token=' + token,
        method: 'POST',
        headers: {
            'User-Agent': 'Awesome-Wakaid-App'
        },
        json: { ref: 'production' }
    };

    request(requestOption, callback);
}

function changeDeploymentState (deploymentId, state, repo, callback) {
    var requestOption = {
        url: 'https://api.github.com/repos/wakaid/' + repo + '/deployments/' + deploymentId + '/statuses?access_token=' + token,
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

function changeCommitState (sha, state, repo, callback) {
    var requestOption = {
        url: 'https://api.github.com/repos/wakaid/' + repo + '/statuses/' + sha + '?access_token=' + token,
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

app.get('/deploy-server',
    function (req, res) {
        createDeploymentRequest(AXIST_SERVER, function (err, response, body) {
            if (err) {
                return res.status(500).send(err);
            }

            var deploymentId = body.id;
            var sha = body.sha;

            changeDeploymentState(deploymentId, 'pending', AXIST_SERVER, function (err, response, body) {
                if (err) {
                    return res.status(500).send(err);
                }

                changeCommitState(sha, 'pending', AXIST_SERVER, function (err, response, body) {
                    if (err) {
                        return res.status(500).send(err);
                    }

                    deployServer(deploymentId, sha);

                    res.status(200).send('we are working on deploying your stuffs :)');
                });
            });
        });
    }
);

app.get('/deploy-web',
    function (req, res) {
        createDeploymentRequest(AXIST_WEB, function (err, response, body) {
            if (err) {
                return res.status(500).send(err);
            }

            var deploymentId = body.id;
            var sha = body.sha;

            changeDeploymentState(deploymentId, 'pending', AXIST_WEB, function (err, response, body) {
                if (err) {
                    return res.status(500).send(err);
                }

                changeCommitState(sha, 'pending', AXIST_WEB, function (err, response, body) {
                    if (err) {
                        return res.status(500).send(err);
                    }

                    deployWeb(deploymentId, sha);

                    res.status(200).send('we are working on deploying your stuffs :)');
                });
            });
        });
    }
);

app.listen(process.env.PORT || 8081);