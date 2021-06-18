#!/bin/bash

#: Title       : Kafka Start script
#: Date        : 2021-06-16
#: Author      : "Helio Frota" <00hf11 at gmail dot com>
#: Version     : 0.0.1
#: Description : Starts kafka in 'zookeeper-less' mode

function waitFor {
  C=50
  while [ $C -gt 0 ]
  do
    grep "Kafka Server started" kafka_2.12-2.8.0/logs/server.log
    if [ $? -eq 0 ]; then
      echo "Server started"
      C=0
    else
      echo -n "."
      C=$(( $C - 1 ))
    fi
    sleep 1
  done
}

if [ ! -f "kafka_2.12-2.8.0.tgz" ]
then 
  wget https://downloads.apache.org/kafka/2.8.0/kafka_2.12-2.8.0.tgz
fi

tar xf kafka**.tgz
cd kafka_2.12-2.8.0
sed -i "/listeners=PLAINTEXT:\/\/:9092,CONTROLLER:\/\/:9093/ s/listeners=PLAINTEXT:\/\/:9092,CONTROLLER:\/\/:9093/listeners=PLAINTEXT:\/\/localhost:9092,CONTROLLER:\/\/localhost:9093/" ./config/kraft/server.properties
sed -i "/num.network.threads=/ s/num.network.threads=3/num.network.threads=1/" ./config/kraft/server.properties
sed -i "/num.io.threads=/ s/num.io.threads=8/num.io.threads=1/" ./config/kraft/server.properties
ID=$(./bin/kafka-storage.sh random-uuid)
./bin/kafka-storage.sh format -t $ID -c ./config/kraft/server.properties
./bin/kafka-server-start.sh -daemon ./config/kraft/server.properties
cd ..
sleep 1

waitFor