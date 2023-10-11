const AWS = require('aws-sdk');

AWS.config.loadFromPath(__dirname + '/../config/credential.json');

const DB = new AWS.DynamoDB.DocumentClient({convertEmptyValues: true});

module.exports = DB;