const Kaka = require('node-rdkafka');
const Chance = require('chance');

const chance = new Chance();

function initProducer () {
  const producer = new Kaka.Producer({
    'bootstrap.servers': process.env.KAFKA_BOOTSTRAP_SERVER || 'my-cluster-kafka-bootstrap:9092'
  });

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
