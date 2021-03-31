const { Kafka } = require('kafkajs');
const express = require('express');
const ws = require('ws');
const probe = require('kube-probe');
const app = express();

// Add basic health check endpoints
probe(app);

const wsServer = new ws.Server({ noServer: true });

const update = (value) =>
  wsServer.clients.forEach((socket) => socket.send(value));

const kfk = new Kafka({
  clientId: 'kafkajs-consumer',
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVER || 'my-cluster-kafka-bootstrap:9092']
});

const consumer = kfk.consumer({ groupId: 'consumer-test' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'countries', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
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
