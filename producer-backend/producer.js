const { Kafka } = require('kafkajs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../rhoas.env') });
const Chance = require('chance');
const serviceBindings = require('kube-service-bindings');
const chance = new Chance();
const { oauthBearerProvider } = require('./utils.js');

const topic = process.env.KAFKA_TOPIC || 'countries';

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
    process.env.KAFKA_CLIENT_ID || 'kafkajs-producer';

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

const producer = kfk.producer();

const createMessage = async () => {
  try {
    const msg = {
      key: 'example',
      value: chance.country({ full: true }),
      partition: 0
    };
    await producer.send({
      topic,
      messages: [msg]
    });
    console.log(msg.value);
  } catch (err) {
    console.log(err);
  }
};

const run = async () => {
  await producer.connect();
  setInterval(createMessage, 1000);
};

run().catch(console.error);
