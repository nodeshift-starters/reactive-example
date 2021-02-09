const Kafka = require('node-rdkafka');
const express = require('express');
const ws = require('ws');

const app = express();

const wsServer = new ws.Server({ noServer: true });

const update = (value) =>
  wsServer.clients.forEach((socket) => socket.send(value));

const stream = Kafka.KafkaConsumer.createReadStream(
  {
    'metadata.broker.list': 'localhost:9092',
    'group.id': 'consumer-test',
    'socket.keepalive.enable': true,
    'enable.auto.commit': false,
  },
  {},
  {
    topics: 'countries',
  }
);

stream.on('error', (err) => {
  if (err) console.log(err);
});

stream.on('data', (message) => {
  update(message.value.toString());
});

const server = app.listen('3000');

server.on('upgrade', (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (socket) => {
    wsServer.emit('connection', socket, request);
  });
});
