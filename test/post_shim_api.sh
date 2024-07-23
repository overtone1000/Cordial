#! /bin/bash

echo "Sending test POST"

curl --location --request POST "localhost:43528/shim/" \
--header 'Content-Type: application/json' \
--data-raw '{"Debug"}'