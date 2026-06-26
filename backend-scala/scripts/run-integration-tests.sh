#!/bin/bash

# OffMe Integration Tests Runner
# This script sets up the test environment and runs integration tests

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_ENVIRONMENT="integration"
DOCKER_COMPOSE_FILE="../infra/docker-compose.yml"
BACKEND_DIR=$(pwd)
INFRA_DIR="$BACKEND_DIR/../infra"
TEST_REPORT_DIR="$BACKEND_DIR/test-reports"
TEST_COVERAGE_DIR="$BACKEND_DIR/test-coverage"

# Create directories if they don't exist
mkdir -p "$TEST_REPORT_DIR"
mkdir -p "$TEST_COVERAGE_DIR"

# Function to print colored messages
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}[OffMe Integration Tests]${NC} $message"
}

# Function to check if a service is running
is_service_running() {
    local service=$1
    local port=$2

    if nc -z localhost "$port" 2>/dev/null; then
        print_message "$GREEN" "✓ $service is running on port $port"
        return 0
    else
        print_message "$RED" "✗ $service is NOT running on port $port"
        return 1
    fi
}

# Function to wait for services to be ready
wait_for_services() {
    print_message "$BLUE" "Waiting for services to be ready..."

    # Wait for PostgreSQL
    for i in {1..30}; do
        if is_service_running "PostgreSQL" "5432"; then
            break
        fi
        sleep 2
    done

    # Wait for Redis
    for i in {1..30}; do
        if is_service_running "Redis" "6379"; then
            break
        fi
        sleep 2
    done

    # Wait for Cassandra
    for i in {1..60}; do
        if is_service_running "Cassandra" "9042"; then
            break
        fi
        sleep 2
    done

    # Wait for Kafka
    for i in {1..30}; do
        if is_service_running "Kafka" "9092"; then
            break
        fi
        sleep 2
    done
}

# Function to start infrastructure services
start_infrastructure() {
    print_message "$BLUE" "Starting infrastructure services..."

    cd "$INFRA_DIR"
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        docker compose -f "$DOCKER_COMPOSE_FILE" up -d postgres redis cassandra kafka zookeeper

        # Initialize Cassandra schema
        if [ -f "cassandra-init.sh" ]; then
            print_message "$BLUE" "Initializing Cassandra schema..."
            ./cassandra-init.sh
        fi

        wait_for_services
    else
        print_message "$RED" "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    cd "$BACKEND_DIR"
}

# Function to stop infrastructure services
stop_infrastructure() {
    print_message "$BLUE" "Stopping infrastructure services..."

    cd "$INFRA_DIR"
    if [ -f "$DOCKER_COMPOSE_FILE" ]; then
        docker compose -f "$DOCKER_COMPOSE_FILE" down
    fi
    cd "$BACKEND_DIR"
}

# Function to build backend services
build_backend_services() {
    print_message "$BLUE" "Building backend services..."

    cd "$BACKEND_DIR"
    sbt clean compile
}

# Function to start backend services in background
start_backend_services() {
    print_message "$BLUE" "Starting backend services..."

    cd "$BACKEND_DIR"

    # Start Post Service
    print_message "$BLUE" "Starting Post Service..."
    sbt "postService/run" > /tmp/post-service.log 2>&1 &
    POST_SERVICE_PID=$!
    sleep 5

    # Start Timeline Service
    print_message "$BLUE" "Starting Timeline Service..."
    sbt "timelineService/run" > /tmp/timeline-service.log 2>&1 &
    TIMELINE_SERVICE_PID=$!
    sleep 5

    # Start Identity Service
    print_message "$BLUE" "Starting Identity Service..."
    sbt "identityService/run" > /tmp/identity-service.log 2>&1 &
    IDENTITY_SERVICE_PID=$!
    sleep 5

    # Start API Gateway
    print_message "$BLUE" "Starting API Gateway..."
    sbt "apiGateway/run" > /tmp/api-gateway.log 2>&1 &
    API_GATEWAY_PID=$!
    sleep 5

    # Wait for services to be ready
    for i in {1..30}; do
        if is_service_running "API Gateway" "8080"; then
            break
        fi
        sleep 2
    done
}

# Function to stop backend services
stop_backend_services() {
    print_message "$BLUE" "Stopping backend services..."

    # Kill all background processes
    if [ -n "$POST_SERVICE_PID" ]; then
        kill "$POST_SERVICE_PID" 2>/dev/null || true
    fi
    if [ -n "$TIMELINE_SERVICE_PID" ]; then
        kill "$TIMELINE_SERVICE_PID" 2>/dev/null || true
    fi
    if [ -n "$IDENTITY_SERVICE_PID" ]; then
        kill "$IDENTITY_SERVICE_PID" 2>/dev/null || true
    fi
    if [ -n "$API_GATEWAY_PID" ]; then
        kill "$API_GATEWAY_PID" 2>/dev/null || true
    fi

    # Wait for processes to terminate
    sleep 3

    # Kill any remaining processes
    pkill -f "postService" || true
    pkill -f "timelineService" || true
    pkill -f "identityService" || true
    pkill -f "apiGateway" || true
}

# Function to run integration tests
run_integration_tests() {
    print_message "$BLUE" "Running integration tests..."

    cd "$BACKEND_DIR"

    # Run tests with coverage
    sbt "apiGateway/test" \
        -Dtest.environment=integration \
        -Dtest.report.dir="$TEST_REPORT_DIR" \
        -Dtest.coverage.enabled=true \
        -Dtest.coverage.dir="$TEST_COVERAGE_DIR"

    # Generate test report
    print_message "$BLUE" "Generating test report..."
    sbt "apiGateway/test:testReport"

    print_message "$GREEN" "Integration tests completed. Reports available in: $TEST_REPORT_DIR"
}

# Function to generate coverage report
generate_coverage_report() {
    print_message "$BLUE" "Generating coverage report..."

    cd "$BACKEND_DIR"
    sbt "apiGateway/coverageReport"

    print_message "$GREEN" "Coverage report generated. Available in: $TEST_COVERAGE_DIR"
}

# Function to cleanup test environment
cleanup() {
    print_message "$BLUE" "Cleaning up test environment..."

    # Stop services
    stop_backend_services
    stop_infrastructure

    # Remove temporary files
    rm -f /tmp/post-service.log
    rm -f /tmp/timeline-service.log
    rm -f /tmp/identity-service.log
    rm -f /tmp/api-gateway.log

    print_message "$GREEN" "Cleanup completed"
}

# Function to show test results summary
show_test_summary() {
    print_message "$BLUE" "Test Results Summary"

    if [ -d "$TEST_REPORT_DIR" ]; then
        echo "--- Test Reports ---"
        ls -la "$TEST_REPORT_DIR"

        if [ -f "$TEST_REPORT_DIR/index.html" ]; then
            print_message "$GREEN" "HTML Test Report: file://$TEST_REPORT_DIR/index.html"
        fi
    fi

    if [ -d "$TEST_COVERAGE_DIR" ]; then
        echo "--- Coverage Reports ---"
        ls -la "$TEST_COVERAGE_DIR"

        if [ -f "$TEST_COVERAGE_DIR/index.html" ]; then
            print_message "$GREEN" "HTML Coverage Report: file://$TEST_COVERAGE_DIR/index.html"
        fi
    fi
}

# Main execution
main() {
    print_message "$YELLOW" "Starting OffMe Integration Tests"
    print_message "$BLUE" "Environment: $TEST_ENVIRONMENT"
    print_message "$BLUE" "Timestamp: $(date)"

    # Trap signals to ensure cleanup
    trap cleanup EXIT INT TERM

    # Start infrastructure
    start_infrastructure

    # Build backend services
    build_backend_services

    # Start backend services
    start_backend_services

    # Run integration tests
    run_integration_tests

    # Generate coverage report
    generate_coverage_report

    # Show test summary
    show_test_summary

    print_message "$GREEN" "Integration tests completed successfully!"
}

# Run main function
main "$@"