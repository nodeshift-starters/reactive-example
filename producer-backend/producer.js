const { Kafka } = require('kafkajs');
const Chance = require('chance');
const serviceBindings = require('kube-service-bindings');

const chance = new Chance();

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
}

// add the client id
kafkaConnectionBindings.clientId = 'kafkajs-producer';

const kfk = new Kafka(kafkaConnectionBindings);

const producer = kfk.producer();

const createMessage = async () => {
  try {
    await producer.send({
      topic: 'countries',
      messages: [{ value: chance.country({ full: true }) }]
    });
  } catch (err) {
    console.log(err);
  }
};

const run = async () => {
  await producer.connect();
  setInterval(createMessage, 1000);
};

run().catch(console.error);
