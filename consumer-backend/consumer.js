const Kafka = require('node-rdkafka');
const express = require('express');
const ws = require('ws');
const probe = require('kube-probe');
const app = express();

// Add basic health check endpoints
probe(app);

const wsServer = new ws.Server({ noServer: true });

const update = (value) =>
  wsServer.clients.forEach((socket) => socket.send(value));

const stream = Kafka.KafkaConsumer.createReadStream(
  {
    'metadata.broker.list': process.env.KAFKA_BOOTSTRAP_SERVER || 'my-cluster-kafka-bootstrap:9092',
    'group.id': 'consumer-test', // identifier to use to help trace activity in Kafka
    'socket.keepalive.enable': true, // Enable TCP keep-alives on broker sockets
    'enable.auto.commit': false // Automatically and periodically commit offsets in the background.
  },
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
