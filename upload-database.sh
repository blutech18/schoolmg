#!/bin/bash

# Upload schoolmgtdb.sql to Railway MySQL Database
# Usage: ./upload-database.sh

echo "Uploading database to Railway..."

mysql -h ballast.proxy.rlwy.net \
      -u root \
      -p'AvngfWibvxTercOiYBiicVYUauOhWdol' \
      --port 35590 \
      --protocol=TCP \
      railway < schoolmgtdb.sql

if [ $? -eq 0 ]; then
    echo "Database uploaded successfully!"
else
    echo "Error uploading database. Please check your connection details."
fi

