const { Kafka } = require('kafkajs');
const path = require('path');
require('dotenv').config({path: path.join(__dirname,'../.env')});
const express = require('express');
const ws = require('ws');
const probe = require('kube-probe');
const app = express();
const serviceBindings = require('kube-service-bindings');

// Add basic health check endpoints
probe(app);

const wsServer = new ws.Server({ noServer: true });

const update = (value) =>
  wsServer.clients.forEach((socket) => socket.send(value));

let kafkaConnectionBindings;
try {
  // check if the deployment has been bound to a kafka instance through
  // service bindings. If so use that connect info
  kafkaConnectionBindings = serviceBindings.getBinding('KAFKA', 'kafkajs');
} catch (err) {
  // No service bindings. TODO: better error handling here
  kafkaConnectionBindings = {
    brokers: [process.env.KAFKA_BOOTSTRAP_SERVER || 'my-cluster-kafka-bootstrap:9092']
  };
  if (process.env.KAFKA_SASL_MECHANISM === 'plain') {
    kafkaConnectionBindings.sasl =  { mechanism: process.env.KAFKA_SASL_MECHANISM,
                                      username: process.env.KAFKA_CLIENT_ID,
                                      password: process.env.KAFKA_CLIENT_SECRET }
    kafkaConnectionBindings.ssl = true;
  }
}

// add the client id
kafkaConnectionBindings.clientId = 'kafkajs-consumer';

const kfk = new Kafka(kafkaConnectionBindings);

const consumer = kfk.consumer({ groupId: 'consumer-test' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'countries', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      console.log(message.value.toString());
      update(message.value.toString());
    }
  });
};

run();
const server = app.listen('8080');

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit('connection', socket, request);
  });
});
