# 🚀 OffMe AWS Serverless Deployment Guide

## 🎯 Overview

This guide provides step-by-step instructions for deploying the OffMe backend to AWS using serverless architecture (Lambda + API Gateway), completely replacing Docker with cloud-native services.

## 📋 Prerequisites

### 1. AWS Account
- Sign up for AWS: [https://aws.amazon.com](https://aws.amazon.com)
- Set up billing alerts to monitor costs
- Recommended: Use AWS Free Tier for initial testing

### 2. Required Tools
- **AWS CLI**: [Installation Guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
- **AWS SAM CLI**: [Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- **Java 11+**: Required for Scala compilation
- **SBT**: Scala Build Tool
- **Git**: For version control

### 3. Development Environment
```bash
# Install required tools on macOS
brew install awscli aws-sam-cli openjdk@11 sbt

# Install required tools on Linux (Ubuntu)
sudo apt update
sudo apt install -y awscli java11 sbt git
curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip -o aws-sam-cli.zip
unzip aws-sam-cli.zip -d sam-installation
sudo ./sam-installation/install
```

## 🔧 Step 1: Configure AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Enter your AWS Access Key ID, Secret Access Key, default region (us-east-1), and output format (json)

# Verify configuration
aws sts get-caller-identity
```

## 📦 Step 2: Prepare Database Infrastructure

### Option A: Amazon RDS PostgreSQL

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier offme-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.6 \
  --allocated-storage 20 \
  --master-username offme \
  --master-user-password your-secure-password \
  --backup-retention-period 7 \
  --publicly-accessible \
  --storage-type gp2 \
  --vpc-security-group-ids your-security-group-id \
  --availability-zone us-east-1a

# Wait for database to be available (10-15 minutes)
aws rds wait db-instance-available --db-instance-identifier offme-db

# Get database endpoint
DB_HOST=$(aws rds describe-db-instances --db-instance-identifier offme-db --query 'DBInstances[0].Endpoint.Address' --output text)
echo "Database host: $DB_HOST"
```

### Option B: Amazon Aurora Serverless (Recommended for variable workloads)

```bash
# Create Aurora Serverless cluster
aws rds create-db-cluster \
  --db-cluster-identifier offme-aurora \
  --engine aurora-postgresql \
  --engine-version 14.6 \
  --master-username offme \
  --master-user-password your-secure-password \
  --database-name offme \
  --enable-http-endpoint \
  --deletion-protection \
  --scaling-configuration MinCapacity=2,MaxCapacity=8,AutoPause=true,SecondsUntilAutoPause=300

# Create database instance
aws rds create-db-instance \
  --db-instance-identifier offme-aurora-instance \
  --db-cluster-identifier offme-aurora \
  --engine aurora-postgresql \
  --db-instance-class db.serverless
```

## 🔌 Step 3: Set Up Redis (ElastiCache)

```bash
# Create ElastiCache Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id offme-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1 \
  --cache-subnet-group-name default \
  --security-group-ids your-security-group-id

# Get Redis endpoint
REDIS_HOST=$(aws elasticache describe-cache-clusters --cache-cluster-id offme-redis --query 'CacheClusters[0].ConfigurationEndpoint.Address' --output text)
echo "Redis host: $REDIS_HOST"
```

## 🛡️ Step 4: Configure Security Groups

```bash
# Create security group for Lambda functions
LAMBDA_SG=$(aws ec2 create-security-group \
  --group-name offme-lambda-sg \
  --description "Security group for OffMe Lambda functions" \
  --query 'GroupId' \
  --output text)

# Add outbound rules to allow database access
aws ec2 authorize-security-group-egress \
  --group-id $LAMBDA_SG \
  --protocol tcp \
  --port 5432 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-egress \
  --group-id $LAMBDA_SG \
  --protocol tcp \
  --port 6379 \
  --cidr 0.0.0.0/0
```

## 📁 Step 5: Prepare OffMe Codebase

```bash
# Clone the repository (if not already done)
git clone https://github.com/rulio1/OffMe.git
cd OffMe

# Navigate to AWS SAM directory
cd aws-sam
```

## 🔨 Step 6: Build and Package Lambda Functions

```bash
# Build Scala services
cd ../../backend-scala
sbt clean compile

# Copy Lambda handler to each service
cp ../aws-sam/LambdaHandler.scala identity-service/src/main/scala/com/offme/identity/
cp ../aws-sam/LambdaHandler.scala post-service/src/main/scala/com/offme/post/
cp ../aws-sam/LambdaHandler.scala timeline-service/src/main/scala/com/offme/timeline/
cp ../aws-sam/LambdaHandler.scala graph-service/src/main/scala/com/offme/graph/
cp ../aws-sam/LambdaHandler.scala notification-service/src/main/scala/com/offme/notification/
cp ../aws-sam/LambdaHandler.scala websocket-service/src/main/scala/com/offme/websocket/

# Build each service
sbt "identity-service/compile"
sbt "post-service/compile"
sbt "timeline-service/compile"
sbt "graph-service/compile"
sbt "notification-service/compile"
sbt "websocket-service/compile"

cd ../aws-sam

# Build SAM template
sam build
```

## 🚀 Step 7: Deploy to AWS

### Option A: Guided Deployment (Recommended for first time)

```bash
sam deploy --guided

# Follow the prompts:
# - Stack Name: offme-backend-prod
# - AWS Region: us-east-1
# - Confirm changes before deploy: y
# - Allow SAM CLI IAM role creation: y
# - Save arguments to samconfig.toml: y
```

### Option B: Direct Deployment with Parameters

```bash
# Set environment variables
export STAGE=prod
export REGION=us-east-1
export DB_HOST=your-db-endpoint.rds.amazonaws.com
export DB_USER=offme
export DB_PASSWORD=your-db-password
export JWT_SECRET=your-long-random-secret-key-1234567890
export REDIS_HOST=your-redis-endpoint.cache.amazonaws.com

# Deploy
sam deploy \
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
```

## 🔄 Step 8: Update Frontend Configuration

After successful deployment, update your frontend configuration:

```javascript
// frontend-web/src/lib/api.ts
export const API_BASE_URL = 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/api/v1';
export const WS_BASE_URL = 'wss://your-websocket-api-id.execute-api.us-east-1.amazonaws.com/prod';
```

## 📊 Step 9: Set Up Monitoring and Alerts

```bash
# Create CloudWatch Dashboard
aws cloudwatch put-dashboard \
  --dashboard-name OffMe-Backend \
  --dashboard-body '{
    "widgets": [
      {
        "type": "metric",
        "x": 0,
        "y": 0,
        "width": 12,
        "height": 6,
        "properties": {
          "metrics": [
            ["AWS/Lambda", "Invocations", "FunctionName", "offme-backend-prod-IdentityServiceFunction", {"stat": "Sum"}],
            ["...", {"stat": "Sum"}]
          ],
          "period": 300,
          "stat": "Sum",
          "region": "us-east-1",
          "title": "Lambda Invocations"
        }
      }
    ]
  }'

# Set up billing alerts
aws budgets create-budget \
  --account-id your-account-id \
  --budget file://budget.json \
  --notifications-with-subscribers file://notifications.json
```

## 🔒 Step 10: Security Best Practices

### IAM Permissions
```bash
# Create minimal IAM policy for Lambda functions
cat > lambda-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBInstances",
        "rds:Connect"
      ],
      "Resource": "arn:aws:rds:*:*:db:offme-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticache:DescribeCacheClusters",
        "elasticache:Connect"
      ],
      "Resource": "arn:aws:elasticache:*:*:cluster:offme-*"
    }
  ]
}
EOF

aws iam create-policy --policy-name OffMeLambdaPolicy --policy-document file://lambda-policy.json
```

### Secrets Management
```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name offme/db-credentials \
  --secret-string '{"username":"offme","password":"your-db-password"}'

aws secretsmanager create-secret \
  --name offme/jwt-secret \
  --secret-string '{"secret":"your-long-random-secret-key-1234567890"}'
```

## 🔄 Step 11: CI/CD Setup

### GitHub Actions Workflow
```yaml
# .github/workflows/aws-deploy.yml
name: AWS Deployment

on:
  push:
    branches: [ main ]

env:
  AWS_REGION: us-east-1
  STAGE: prod

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Java
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'temurin'
      - name: Test
        run: cd backend-scala && sbt test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      - name: Set up Java
        uses: actions/setup-java@v3
        with:
          java-version: '11'
          distribution: 'temurin'
      - name: Install SAM CLI
        run: |
          curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip -o aws-sam-cli.zip
          unzip aws-sam-cli.zip -d sam-installation
          sudo ./sam-installation/install
      - name: Build and Deploy
        run: |
          cd aws-sam
          ./deploy.sh --stage ${{ env.STAGE }} --region ${{ env.AWS_REGION }}
```

## 💰 Cost Optimization

### Lambda Configuration
- **Memory**: 1024MB (adjust based on your needs)
- **Timeout**: 30 seconds (increase if needed)
- **Concurrency**: Start with 100 concurrent executions

### Cost Estimate
| Service | Estimated Cost (Monthly) |
|---------|--------------------------|
| Lambda | $10-50 (depending on usage) |
| API Gateway | $5-20 |
| RDS PostgreSQL | $30-100 (db.t3.micro) |
| ElastiCache Redis | $20-50 (cache.t3.micro) |
| CloudWatch | $5-15 |
| **Total** | **$70-235/month** |

## 🐛 Troubleshooting

### Common Issues

**1. Cold Start Problems**
```bash
# Solution: Use Provisioned Concurrency
aws lambda put-provisioned-concurrency-config \
  --function-name offme-backend-prod-IdentityServiceFunction \
  --qualifier $LATEST \
  --provisioned-concurrent-executions 5
```

**2. Database Connection Issues**
```bash
# Check VPC and security group configuration
aws ec2 describe-security-groups --group-ids your-security-group-id
```

**3. CORS Issues**
```bash
# Update API Gateway CORS settings in template.yaml
Cors:
  AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
  AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
  AllowOrigin: "'*'"
  MaxAge: "'600'"
```

## 📚 Additional Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html)
- [AWS Lambda for Java](https://docs.aws.amazon.com/lambda/latest/dg/java-handler.html)
- [API Gateway WebSocket](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-websocket-api.html)
- [AWS Free Tier](https://aws.amazon.com/free/)

## ✅ Deployment Checklist

- [ ] Create AWS account and configure credentials
- [ ] Set up PostgreSQL database (RDS or Aurora)
- [ ] Configure Redis (ElastiCache)
- [ ] Set up security groups and IAM roles
- [ ] Build and package Lambda functions
- [ ] Deploy using SAM CLI
- [ ] Update frontend configuration
- [ ] Set up monitoring and alerts
- [ ] Configure CI/CD pipeline
- [ ] Test all API endpoints
- [ ] Monitor costs and performance

**🎉 Your OffMe backend is now running on AWS Lambda without Docker!**