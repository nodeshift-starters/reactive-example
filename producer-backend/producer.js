const Kafka = require('node-rdkafka');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../rhoas.env') });
const Chance = require('chance');
const serviceBindings = require('kube-service-bindings');

const chance = new Chance();

function initProducer () {
  // set default kafka bindings for connecting to the kafka broker
  let kafkaConnectionBindings =
    {
      'metadata.broker.list': process.env.KAFKA_HOST ||
                              'my-cluster-kafka-bootstrap:9092',
      dr_cb: true
    };

  try {
    // check if the deployment has been bound to a kafka instance through
    // service bindings. If so use that connect info
    kafkaConnectionBindings = serviceBindings.getBinding('KAFKA', 'node-rdkafka');
  } catch (err) {
    if (process.env.KAFKA_SASL_MECHANISM === 'plain') {
      kafkaConnectionBindings['sasl.mechanisms'] = 'PLAIN';
      kafkaConnectionBindings['security.protocol'] = 'SASL_SSL';
      kafkaConnectionBindings['sasl.password'] = process.env.RHOAS_SERVICE_ACCOUNT_CLIENT_SECRET;
      kafkaConnectionBindings['sasl.username'] = process.env.RHOAS_SERVICE_ACCOUNT_CLIENT_ID;
    }
  }

  const producer = new Kafka.Producer(kafkaConnectionBindings);

  // To make reconnection work.
  producer.setPollInterval(300);

  return new Promise((resolve, reject) => {
    producer.connect();
    producer.on('ready', () => resolve(producer));
    producer.on('event.error', (err) => {
      if (err) {
        console.error(err);
        // producer.disconnect(); if we call disconnect here, it will not reconnect.
        reject(err);
      }
    });
  });
}

async function createMessage (producer) {
  const value = Buffer.from(chance.country({ full: true }));
  try {
    // topic, partition, message, key, timestamp
    console.log(value.toString());
    producer.produce('countries', 0, value, 'example', 0);
  } catch (err) {
    console.error(err);
  }
}

async function run () {
  let producer;
  try {
    producer = await initProducer();
    setInterval(createMessage, 1000, producer);
  } catch (err) {
    console.error(err);
  }
}

run();
