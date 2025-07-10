#!/bin/sh

# Health check script for Docker container
# This script will be used by Docker to check if the container is healthy

# Check if nginx is running
if ! pgrep nginx > /dev/null; then
    echo "Nginx is not running"
    exit 1
fi

# Check if the application is accessible
if ! curl -f http://localhost:80 > /dev/null 2>&1; then
    echo "Application is not accessible"
    exit 1
fi

echo "Application is healthy"
exit 0
