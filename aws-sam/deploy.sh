#!/bin/bash

# OffMe AWS SAM Deployment Script
# This script deploys the OffMe backend to AWS Lambda using SAM

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo -e "${RED}Error: AWS CLI is not installed.${NC}"
    echo "Please install AWS CLI first: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check if SAM CLI is installed
if ! command -v sam &> /dev/null; then
    echo -e "${RED}Error: AWS SAM CLI is not installed.${NC}"
    echo "Please install SAM CLI first: https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html"
    exit 1
fi

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo -e "${RED}Error: Java is not installed.${NC}"
    echo "Please install Java 11+"
    exit 1
fi

# Check if SBT is installed
if ! command -v sbt &> /dev/null; then
    echo -e "${RED}Error: SBT is not installed.${NC}"
    echo "Please install SBT: https://www.scala-sbt.org/download.html"
    exit 1
fi

# Function to display help
display_help() {
    echo -e "${YELLOW}OffMe AWS SAM Deployment Script${NC}"
    echo ""
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  -s, --stage STAGE    Deployment stage (dev, staging, prod). Default: dev"
    echo "  -r, --region REGION  AWS region. Default: us-east-1"
    echo "  -h, --help           Display this help message"
    echo ""
    echo "Example:"
    echo "  $0 --stage prod --region us-east-1"
}

# Parse command line arguments
STAGE="dev"
REGION="us-east-1"

while [[ $# -gt 0 ]]; do
    case "$1" in
        -s|--stage)
            STAGE="$2"
            shift 2
            ;;
        -r|--region)
            REGION="$2"
            shift 2
            ;;
        -h|--help)
            display_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            display_help
            exit 1
            ;;
    esac
done

echo -e "${GREEN}=== OffMe AWS SAM Deployment ===${NC}"
echo -e "${YELLOW}Stage: $STAGE${NC}"
echo -e "${YELLOW}Region: $REGION${NC}"

# Build the project
echo -e "${GREEN}=== Building Scala Services ===${NC}"
cd ../../backend-scala

# Build each service
echo "Building identity-service..."
sbt "identity-service/compile" || { echo -e "${RED}Build failed${NC}"; exit 1; }

echo "Building post-service..."
sbt "post-service/compile" || { echo -e "${RED}Build failed${NC}"; exit 1; }

echo "Building timeline-service..."
sbt "timeline-service/compile" || { echo -e "${RED}Build failed${NC}"; exit 1; }

echo "Building graph-service..."
sbt "graph-service/compile" || { echo -e "${RED}Build failed${NC}"; exit 1; }

echo "Building notification-service..."
sbt "notification-service/compile" || { echo -e "${RED}Build failed${NC}"; exit 1; }

echo "Building websocket-service..."
sbt "websocket-service/compile" || { echo -e "${RED}Build failed${NC}"; exit 1; }

cd ../../aws-sam

# Package the Lambda functions
echo -e "${GREEN}=== Packaging Lambda Functions ===${NC}"

# Copy Lambda handler to each service
cp LambdaHandler.scala ../../backend-scala/identity-service/src/main/scala/com/offme/identity/
cp LambdaHandler.scala ../../backend-scala/post-service/src/main/scala/com/offme/post/
cp LambdaHandler.scala ../../backend-scala/timeline-service/src/main/scala/com/offme/timeline/
cp LambdaHandler.scala ../../backend-scala/graph-service/src/main/scala/com/offme/graph/
cp LambdaHandler.scala ../../backend-scala/notification-service/src/main/scala/com/offme/notification/
cp LambdaHandler.scala ../../backend-scala/websocket-service/src/main/scala/com/offme/websocket/

# Build the SAM template
echo -e "${GREEN}=== Building SAM Template ===${NC}"
sam build

# Check if AWS credentials are configured
if ! aws sts get-caller-identity &> /dev/null; then
    echo -e "${RED}Error: AWS credentials not configured.${NC}"
    echo "Please run 'aws configure' and set up your AWS credentials."
    exit 1
fi

# Deploy the stack
echo -e "${GREEN}=== Deploying Stack ===${NC}"
echo "This may take several minutes..."

sam deploy --guided \
    --stack-name offme-backend-$STAGE \
    --region $REGION \
    --capabilities CAPABILITY_IAM \
    --parameter-overrides \
        Stage=$STAGE \
        DBHost=$DB_HOST \
        DBUsername=$DB_USER \
        DBPassword=$DB_PASSWORD \
        JWTSecret=$JWT_SECRET \
        RedisHost=$REDIS_HOST

# Get stack outputs
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "${YELLOW}Stack Outputs:${NC}"

aws cloudformation describe-stacks \
    --stack-name offme-backend-$STAGE \
    --region $REGION \
    --query "Stacks[0].Outputs" \
    --output table

echo -e "${GREEN}=== Next Steps ===${NC}"
echo "1. Update your frontend configuration with the new API Gateway URL"
echo "2. Test the API endpoints"
echo "3. Set up monitoring and alerts"
echo "4. Configure CI/CD for automatic deployments"

echo -e "${GREEN}✅ Deployment successful!${NC}"