const Kaka = require('node-rdkafka');
const Chance = require('chance');
const serviceBindings = require('kube-service-bindings');

const chance = new Chance();

function initProducer () {
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

  const producer = new Kaka.Producer(kafkaConnectionBindings);

  return new Promise((resolve, reject) => {
    producer.connect();
    producer.on('ready', () => resolve(producer));
    producer.on('event.log', (log) => {
      if (log.fac === 'FAIL') {
        producer.disconnect();
        reject(log.message);
      }
    });
  });
}

async function createMessage (producer) {
  const value = Buffer.from(chance.country({ full: true }));
  console.log('producing...');
  try {
    producer.produce('countries', null, value);
  } catch (err) {
    console.error(err);
  }
  console.log('done.');
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
