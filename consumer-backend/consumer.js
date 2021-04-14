const Kafka = require('node-rdkafka');
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

// set default kafa bindings for connecting to the kafka broker
let kafkaConnectionBindings =
  {
    'metadata.broker.list': process.env.KAFKA_BOOTSTRAP_SERVER ||
                            'my-cluster-kafka-bootstrap:9092'
  };

try {
  // check if the deployment has been bound to a kafka instance through
  // service bindings. If so use that connect info
  kafkaConnectionBindings = serviceBindings.getBinding('KAFKA', 'node-rdkafka');
} catch (err) {}

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
