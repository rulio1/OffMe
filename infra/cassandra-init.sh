#!/bin/bash

# Cassandra Initialization Script for OffMe
# This script waits for Cassandra to be ready and then initializes the schema

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[Cassandra Init]${NC} $message"
}

# Wait for Cassandra to be ready
print_message "$BLUE" "Waiting for Cassandra to be ready..."
until cqlsh -e "DESCRIBE KEYSPACES" cassandra; do
  print_message "$BLUE" "Cassandra not ready yet, retrying in 5 seconds..."
  sleep 5
done

print_message "$GREEN" "✓ Cassandra is ready"

# Check if keyspace already exists
if cqlsh -e "DESCRIBE KEYSPACE offme" cassandra 2>/dev/null; then
    print_message "$GREEN" "✓ Keyspace 'offme' already exists, skipping initialization"
    exit 0
fi

print_message "$BLUE" "Initializing Cassandra schema..."

# Create keyspace
print_message "$BLUE" "Creating keyspace 'offme'..."
cqlsh -e "
CREATE KEYSPACE offme
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1}
AND durable_writes = true;
" cassandra

print_message "$GREEN" "✓ Keyspace 'offme' created"

# Use the keyspace
print_message "$BLUE" "Using keyspace 'offme'..."
cqlsh -e "USE offme;" cassandra

# Create tables for posts
print_message "$BLUE" "Creating posts table..."
cqlsh -e "
CREATE TABLE IF NOT EXISTS posts (
    id BIGINT,
    user_id BIGINT,
    content TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    visibility TEXT,
    media_urls LIST<TEXT>,
    PRIMARY KEY (id)
) WITH CLASING ORDER BY (id DESC);
" cassandra

# Create tables for user timelines
print_message "$BLUE" "Creating user_timeline table..."
cqlsh -e "
CREATE TABLE IF NOT EXISTS user_timeline (
    user_id BIGINT,
    post_id BIGINT,
    created_at TIMESTAMP,
    PRIMARY KEY (user_id, post_id)
) WITH CLASING ORDER BY (post_id DESC);
" cassandra

# Create tables for home timelines
print_message "$BLUE" "Creating home_timeline table..."
cqlsh -e "
CREATE TABLE IF NOT EXISTS home_timeline (
    user_id BIGINT,
    post_id BIGINT,
    author_id BIGINT,
    created_at TIMESTAMP,
    PRIMARY KEY (user_id, post_id)
) WITH CLASING ORDER BY (post_id DESC);
" cassandra

# Create counters table
print_message "$BLUE" "Creating counters table..."
cqlsh -e "
CREATE TABLE IF NOT EXISTS counters (
    name TEXT,
    value COUNTER,
    PRIMARY KEY (name)
);
" cassandra

# Initialize counters
print_message "$BLUE" "Initializing counters..."
cqlsh -e "
UPDATE counters SET value = 0 WHERE name = 'posts';
UPDATE counters SET value = 0 WHERE name = 'users';
" cassandra

print_message "$GREEN" "✓ Cassandra schema initialization completed successfully"

# Verify the schema was created correctly
print_message "$BLUE" "Verifying schema..."
cqlsh -e "
USE offme;
DESCRIBE TABLES;
" cassandra

print_message "$GREEN" "✓ Schema verification completed"
print_message "$GREEN" "Cassandra is ready for use"