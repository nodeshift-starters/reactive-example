#!/bin/bash

#: Title       : Installs producer and consumer and create the countries topic
#: Date        : 2021-06-16
#: Author      : "Helio Frota" <00hf11 at gmail dot com>
#: Version     : 0.0.1
#: Description : same as the title above ^

cd producer-backend
npm i
cd ..
cd consumer-backend
npm i
cd ..

./kafka_2.12-2.8.0/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --topic countries