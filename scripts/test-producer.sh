#!/bin/bash

#: Title       : Message counter test
#: Date        : 2021-06-16
#: Author      : "Helio Frota" <00hf11 at gmail dot com>
#: Version     : 0.0.1
#: Description : Counts the amount of messages sent to the broker

RESULT=$(./kafka_2.12-2.8.0/bin/kafka-run-class.sh kafka.tools.GetOffsetShell --topic=countries --broker-list=localhost:9092 | cut -d ':' -f3)
echo "=============";
echo $RESULT; 
echo "=============";
if (( "$RESULT" > 0 )); 
then 
  echo $RESULT; 
else 
  echo "fail"; 
	exit 1;
fi
