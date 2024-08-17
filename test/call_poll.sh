#! /bin/bash

echo "Sending test POST to call port"
curl --location --request POST "localhost:43529/" \
--header 'Content-Type: application/json' \
--data '["poll"]'