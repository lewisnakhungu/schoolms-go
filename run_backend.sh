#!/bin/bash

# Set default credentials for development
export SUPERADMIN_EMAIL="super@school.com"
export SUPERADMIN_PASSWORD="SuperPassword123!"
export JWT_SECRET="supersecretkeychangeinproduction"
export PORT="8080"

# Fallback to local SQLite if DB_HOST is not set (which is the case for local run without docker)

echo "Starting SchoolMS Backend..."
echo "Superadmin: $SUPERADMIN_EMAIL"
go run main.go
