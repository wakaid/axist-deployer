'use strict';

var express = require('express');
var request = require('request');

var deploy = require('./deployment/script');

var app = express();

function createDeploymentRequest (callback) {
    var requestOption = {
        url: 'https://api.github.com/repos/wakaid/axist-server/deployments?access_token=f7d869606fe0cc5021c1f1f0951da0b59e9b068e',
        method: 'POST',
        headers: {
            'User-Agent': 'Awesome-Wakaid-App'
        },
        json: { ref: 'production' }
    };

    request(requestOption, callback);
}

function changeDeploymentState (deploymentId, state, callback) {
    var requestOption = {
        url: 'https://api.github.com/repos/wakaid/axist-server/deployments/' + deploymentId + '/statuses?access_token=f7d869606fe0cc5021c1f1f0951da0b59e9b068e',
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
        url: 'https://api.github.com/repos/wakaid/axist-server/statuses/' + sha + '?access_token=f7d869606fe0cc5021c1f1f0951da0b59e9b068e',
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

app.get('/deploy',
    function (req, res) {
        createDeploymentRequest(function (err, response, body) {
            if (err) {
                return res.status(500).send(err);
            }

            var deploymentId = body.id;
            var sha = body.sha;

            changeDeploymentState(deploymentId, 'pending', function (err, response, body) {
                if (err) {
                    return res.status(500).send(err);
                }

                changeCommitState(sha, 'pending', function (err, response, body) {
                    if (err) {
                        return res.status(500).send(err);
                    }

                    deploy(deploymentId, sha);

                    res.status(200).send('we are working on deploying your stuffs :)');
                })
            });
        })
    }
);

app.listen(process.env.PORT || 8081);