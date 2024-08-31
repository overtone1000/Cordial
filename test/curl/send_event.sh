#! /bin/bash

echo "Sending test POST to event port"
curl --location --request POST "localhost:43528/" \
--header 'Content-Type: application/json' \
--data '{"debug":"Debug test"}'