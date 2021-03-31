const { Kafka } = require('kafkajs');
const Chance = require('chance');

const chance = new Chance();

const kafka = new Kafka({
  clientId: 'kafkajs-producer',
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVER || 'my-cluster-kafka-bootstrap:9092']
});

const producer = kafka.producer();

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
