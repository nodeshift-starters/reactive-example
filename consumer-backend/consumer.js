const { Kafka } = require('kafkajs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../rhoas.env') });
const express = require('express');
const ws = require('ws');
const app = express();
const serviceBindings = require('kube-service-bindings');
const { oauthBearerProvider } = require('./utils.js');

const topic = process.env.KAFKA_TOPIC || 'countries';
const groupId = process.env.KAFKA_GROUPID || 'consumer-test';

const wsServer = new ws.Server({ noServer: true });

const update = (value) =>
  wsServer.clients.forEach((socket) => socket.send(value));

let kafkaConnectionBindings;
try {
  // check if the deployment has been bound to a kafka instance through
  // service bindings. If so use that connect info
  kafkaConnectionBindings = serviceBindings.getBinding('KAFKA', 'kafkajs');
} catch (err) {
  kafkaConnectionBindings = {
    brokers: [process.env.KAFKA_HOST || 'my-cluster-kafka-bootstrap:9092']
  };

  kafkaConnectionBindings.clientId =
    process.env.KAFKA_CLIENT_ID || 'kafkajs-consumer';
  if (process.env.KAFKA_SASL_MECHANISM === 'plain') {
    kafkaConnectionBindings.ssl = true;
    kafkaConnectionBindings.sasl = {
      mechanism: process.env.KAFKA_SASL_MECHANISM,
      username: process.env.RHOAS_SERVICE_ACCOUNT_CLIENT_ID,
      password: process.env.RHOAS_SERVICE_ACCOUNT_CLIENT_SECRET
    };
  } else if (process.env.KAFKA_SASL_MECHANISM === 'oauthbearer') {
    kafkaConnectionBindings.ssl = true;
    kafkaConnectionBindings.sasl = {
      mechanism: process.env.KAFKA_SASL_MECHANISM,
      oauthBearerProvider: oauthBearerProvider({
        clientId: process.env.RHOAS_SERVICE_ACCOUNT_CLIENT_ID,
        clientSecret: process.env.RHOAS_SERVICE_ACCOUNT_CLIENT_SECRET,
        tokenEndpointURL: process.env.RHOAS_TOKEN_ENDPOINT_URL,
        refreshThresholdMs: 15000
      })
    };
  }
}

const kfk = new Kafka(kafkaConnectionBindings);

const consumer = kfk.consumer({ groupId });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic, fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      console.log(message.value.toString());
      update(message.value.toString());
    }
  });
};

run();

app.get('/api/health/liveness', (req, res) => {
  res.send('OK');
});

app.get('/api/health/readiness', (req, res) => {
  res.send('OK');
});

const server = app.listen('8080');

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit('connection', socket, request);
  });
});
