# reactive-example

This is a basic end-to-end app that demonstrates publishing and subscribing to Kafka.

This is composed by:

- A standalone producer app (producer-backend)
- An Express-Websocket server (consumer-backend)
- A front-end app to connect to consumer's Websocket server to display the messages

> The example is intended to be deployed and run in an Openshift or [CodeReady containers](https://developers.redhat.com/products/codeready-containers/overview) with [Kafka operator](https://strimzi.io/quickstarts/) installed. (Although it is possible to run on a common kafka installation.)

Both producer and consumer are using [node-rdkafka](https://github.com/Blizzard/node-rdkafka).

### producer-backend

The producer-backend is using the [`Producer` constructor](https://github.com/Blizzard/node-rdkafka#sending-messages) to 
send messages to Kafka, which its content is a random country name.

A namespace `nodejs-kafka` was created in Openshift to deploy the tree services. So the producer's `bootstrap.servers` are 
configured like this:

```
new Kaka.Producer({
  'bootstrap.servers': 'nodejs-kafka-cluster-kafka-bootstrap:9092'
})
```

The other part of the name `-cluster-kafka-bootstrap` was created by the Kafka Operator.

### consumer-backend

The consumer-backend is using the [`Consumer Stream API`](https://github.com/Blizzard/node-rdkafka#stream-api-1).

### front-end

The front-end part is a vue app that connects via WebSocket to the consumer back-end on `consumer-backend-nodejs-kafka.apps-crc.testing`.

The example is using [nodeshift](https://github.com/nodeshift/nodeshift) to deploy the apps to Openshift.

### Running the example

```
cd producer-backend
npm install
npm run openshift

cd ../consumer-backend
npm install
npm run openshift

cd ../frontend
npm install
npm run openshift
```

### Customize to run in your kafka environment

**producer-backend**

Change the address of the `bootstrap.servers` https://github.com/nodeshift-starters/reactive-example/blob/main/producer-backend/producer.js#L8

And run:

```
npm install
node producer.js
```

**consumer-backend**

Change the address of the `metadata.broker.list` https://github.com/nodeshift-starters/reactive-example/blob/main/consumer-backend/consumer.js#L17

And run:

```
npm install
node consumer.js
```

**front-end**

Change the address to point to your consumer-backend https://github.com/nodeshift-starters/reactive-example/blob/main/frontend/public/js/index.js#L2

And run:

```
npm install
npm start
```
