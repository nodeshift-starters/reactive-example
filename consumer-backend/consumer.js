const Kafka = require('node-rdkafka');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const express = require('express');
const ws = require('ws');
const app = express();
const serviceBindings = require('kube-service-bindings');

// Add basic health check endpoints
app.use('/ready', (request, response) => {
  return response.sendStatus(200);
});

app.use('/live', (request, response) => {
  return response.sendStatus(200);
});

const wsServer = new ws.Server({ noServer: true });

const update = (value) =>
  wsServer.clients.forEach((socket) => socket.send(value));

// set default kafka bindings for connecting to the kafka broker
let kafkaConnectionBindings =
  {
    'metadata.broker.list': process.env.KAFKA_BOOTSTRAP_SERVER ||
                            'my-cluster-kafka-bootstrap:9092'
  };

try {
  // check if the deployment has been bound to a kafka instance through
  // service bindings. If so use that connect info
  kafkaConnectionBindings = serviceBindings.getBinding('KAFKA', 'node-rdkafka');
} catch (err) {
  if (process.env.KAFKA_SASL_MECHANISM === 'plain') {
    kafkaConnectionBindings['sasl.mechanisms'] = 'PLAIN';
    kafkaConnectionBindings['security.protocol'] = 'SASL_SSL';
    kafkaConnectionBindings['sasl.password'] = process.env.KAFKA_CLIENT_SECRET;
    kafkaConnectionBindings['sasl.username'] = process.env.KAFKA_CLIENT_ID;
  }
}

const stream = Kafka.KafkaConsumer.createReadStream(
  Object.assign({
    'group.id': 'consumer-test', // identifier to use to help trace activity in Kafka
    'socket.keepalive.enable': true, // Enable TCP keep-alives on broker sockets
    'enable.auto.commit': false // Automatically and periodically commit offsets in the background.
  }, kafkaConnectionBindings),
  {},
  {
    topics: 'countries'
  }
);

stream.on('error', (err) => {
  if (err) console.log(err);
});

stream.on('data', (message) => {
  console.log(message.value.toString());
  update(message.value.toString());
});

const server = app.listen('8080');

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit('connection', socket, request);
  });
});
