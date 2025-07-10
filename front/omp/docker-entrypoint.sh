#!/bin/sh

echo "Starting nginx server..."
echo "Frontend will proxy API requests to backend via nginx"

# Start nginx
exec "$@"
