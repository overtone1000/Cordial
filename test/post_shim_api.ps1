$body = '{
    "command": "test"
}'

Invoke-RestMethod -Method POST -Uri 'http://localhost:43528/shim/' -Body ($body | ConvertTo-Json) -ContentType 'application/json'