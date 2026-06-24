#!/bin/bash

# OffMe Cloud Infrastructure Setup
# Configures managed services on AWS/GCP/Azure

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}==> OffMe Cloud Infrastructure Setup${NC}"
echo ""

# Step 1: Configure PostgreSQL (RDS/Aurora or Cloud SQL)
echo -e "${YELLOW}Step 1: Configuring PostgreSQL${NC}"
echo -e "${GREEN}Option A: AWS RDS${NC}"
echo "aws rds create-db-instance \\
  --db-instance-identifier offme-postgres \\
  --db-instance-class db.t4g.medium \\
  --engine postgres \\
  --engine-version 15.4 \\
  --master-username offme \\
  --master-user-password offme_prod_2026 \\
  --allocated-storage 100 \\
  --storage-type gp3 \\
  --backup-retention-period 7 \\
  --multi-az \\
  --publicly-accessible \\
  --vpc-security-group-ids sg-12345678 \\
  --subnet-group-name offme-subnet-group"

echo ""
echo -e "${GREEN}Option B: GCP Cloud SQL${NC}"
echo "gcloud sql instances create offme-postgres \\
  --database-version=POSTGRES_15 \\
  --cpu=2 \\
  --memory=7680MB \\
  --region=us-east1 \\
  --zone=us-east1-b \\
  --root-password=offme_prod_2026 \\
  --storage-size=100GB \\
  --storage-type=SSD \\
  --backup-start-time=04:00 \\
  --enable-point-in-time-recovery \\
  --database-flags=cloudsql.enable_pglogical=on"

echo ""
echo -e "${GREEN}Option C: Azure Database for PostgreSQL${NC}"
echo "az postgres flexible-server create \\
  --name offme-postgres \\
  --resource-group offme-rg \\
  --location eastus \\
  --admin-user offme \\
  --admin-password offme_prod_2026 \\
  --sku-name Standard_D4s_v3 \\
  --storage-size 100 \\
  --version 15 \\
  --backup-retention 7 \\
  --high-availability ZoneRedundant"
echo ""

# Step 2: Configure Cassandra (Keyspaces or Cosmos DB)
echo -e "${YELLOW}Step 2: Configuring Cassandra${NC}"
echo -e "${GREEN}Option A: AWS Keyspaces${NC}"
echo "aws cassandra create-keyspace --keyspace-name offme \\
  --region us-east-1"

echo "aws cassandra create-table \\
  --keyspace-name offme \\
  --table-name posts \\
  --region us-east-1 \\
  --clustering-keys '{\"name\":\"created_at\",\"order\":\"DESC\"}' \\
  --partition-keys '{\"name\":\"post_id\"}' \\
  --attribute-definitions '[{\"name\":\"post_id\",\"type\":\"BIGINT\"},{\"name\":\"created_at\",\"type\":\"TIMESTAMP\"}]'"

echo ""
echo -e "${GREEN}Option B: GCP Cloud Bigtable (Cassandra API)${NC}"
echo "gcloud bigtable instances create offme-cassandra \\
  --cluster=offme-cluster \\
  --cluster-zone=us-east1-b \\
  --display-name=OffMe \\
  --instance-type=PRODUCTION \\
  --cluster-num-nodes=3 \\
  --cluster-storage-type=SSD"

echo ""
echo -e "${GREEN}Option C: Azure Cosmos DB (Cassandra API)${NC}"
echo "az cosmosdb create \\
  --name offme-cassandra \\
  --resource-group offme-rg \\
  --capability-name EnableCassandra \\
  --default-consistency-level Strong \\
  --locations regionName=eastus \\
  --max-interval 10 \\
  --max-staleness-prefix 200"

echo ""

# Step 3: Configure Redis (ElastiCache or Memorystore)
echo -e "${YELLOW}Step 3: Configuring Redis${NC}"
echo -e "${GREEN}Option A: AWS ElastiCache${NC}"
echo "aws elasticache create-cache-cluster \\
  --cache-cluster-id offme-redis \\
  --cache-node-type cache.t4g.medium \\
  --engine redis \\
  --engine-version 7.0 \\
  --num-cache-nodes 2 \\
  --cache-subnet-group-name offme-subnet-group \\
  --security-group-ids sg-12345678 \\
  --snapshot-retention-limit 7 \\
  --auto-minor-version-upgrade true \\
  --transit-encryption-enabled \\
  --at-rest-encryption-enabled"

echo ""
echo -e "${GREEN}Option B: GCP Memorystore${NC}"
echo "gcloud redis instances create offme-redis \\
  --size=5 \\
  --region=us-east1 \\
  --zone=us-east1-b \\
  --tier=STANDARD_HA \\
  --redis-version=REDIS_7_0 \\
  --transit-encryption-mode=SERVER_AUTHENTICATION \\
  --auth-enabled \\
  --connect-mode=DIRECT_PEERING"

echo ""
echo -e "${GREEN}Option C: Azure Cache for Redis${NC}"
echo "az redis create \\
  --name offme-redis \\
  --resource-group offme-rg \\
  --location eastus \\
  --sku Premium \\
  --family P \\
  --capacity 2 \\
  --enable-non-ssl-port false \\
  --redis-version 7 \\
  --shard-count 2 \\
  --minimum-tls-version 1.2"

echo ""

# Step 4: Configure Kafka (MSK or Pub/Sub)
echo -e "${YELLOW}Step 4: Configuring Kafka${NC}"
echo -e "${GREEN}Option A: AWS MSK${NC}"
echo "aws kafka create-cluster \\
  --cluster-name offme-kafka \\
  --kafka-version 3.4.0 \\
  --number-of-broker-nodes 3 \\
  --enhanced-monitoring PER_TOPIC_PER_BROKER \\
  --broker-node-group-info '{\"ClientSubnets\":[\"10.0.1.0/24\",\"10.0.2.0/24\"],\"InstanceType\":\"kafka.m5.large\",\"StorageInfo\":{\"EBSStorageInfo\":{\"VolumeSize\":1000}},\"SecurityGroups\":[\"sg-12345678\"]}' \\
  --encryption-info '{\"EncryptionInTransit\":{\"ClientBroker\":\"TLS_PLAINTEXT\",\"InCluster\":true}}' \\
  --open-monitoring '{\"Prometheus\":{\"JmxExporter\":{\"EnabledInBroker\":true},\"NodeExporter\":{\"EnabledInBroker\":true}}}'"

echo ""
echo -e "${GREEN}Option B: GCP Pub/Sub (Kafka alternative)${NC}"
echo "gcloud pubsub topics create offme-post-created \\
  --message-storage-policy-allowed-regions=us-east1"

echo "gcloud pubsub subscriptions create offme-timeline-sub \\
  --topic=offme-post-created \\
  --ack-deadline-seconds=600 \\
  --message-retention-duration=7d \\
  --expiration-period=never"

echo ""
echo -e "${GREEN}Option C: Azure Event Hubs (Kafka)${NC}"
echo "az eventhubs namespace create \\
  --name offme-kafka \\
  --resource-group offme-rg \\
  --location eastus \\
  --sku Standard \\
  --capacity 2 \\
  --auto-inflate Enabled \\
  --maximum-throughput-units 4"

echo "az eventhubs eventhub create \\
  --name post-created \\
  --namespace-name offme-kafka \\
  --resource-group offme-rg \\
  --partition-count 4 \\
  --message-retention 7 \\
  --status Active"

echo ""

# Step 5: Configure Kubernetes (EKS/GKE/AKS)
echo -e "${YELLOW}Step 5: Configuring Kubernetes${NC}"
echo -e "${GREEN}Option A: AWS EKS${NC}"
echo "eksctl create cluster \\
  --name offme-cluster \\
  --region us-east-1 \\
  --nodegroup-name standard-workers \\
  --node-type t3.xlarge \\
  --nodes 3 \\
  --nodes-min 3 \\
  --nodes-max 6 \\
  --node-ami-family AmazonLinux2 \\
  --managed"

echo ""
echo -e "${GREEN}Option B: GCP GKE${NC}"
echo "gcloud container clusters create offme-cluster \\
  --region us-east1 \\
  --machine-type e2-standard-4 \\
  --num-nodes 3 \\
  --enable-autoscaling \\
  --min-nodes 3 \\
  --max-nodes 6 \\
  --enable-ip-alias \\
  --enable-autorepair \\
  --enable-shielded-nodes \\
  --workload-pool=offme-pool.svc.id.goog"

echo ""
echo -e "${GREEN}Option C: Azure AKS${NC}"
echo "az aks create \\
  --name offme-cluster \\
  --resource-group offme-rg \\
  --node-count 3 \\
  --node-vm-size Standard_D4s_v3 \\
  --enable-addons monitoring \\
  --generate-ssh-keys \\
  --enable-cluster-autoscaler \\
  --min-count 3 \\
  --max-count 6 \\
  --network-plugin azure \\
  --zones 1 2 3"

echo ""

# Step 6: Configure Monitoring (CloudWatch/Stackdriver/Monitor)
echo -e "${YELLOW}Step 6: Configuring Monitoring${NC}"
echo -e "${GREEN}Option A: AWS CloudWatch${NC}"
echo "aws cloudwatch put-dashboard \\
  --dashboard-name OffMe-Dashboard \\
  --dashboard-body '{
    \"widgets\": [
      {
        \"type\": \"metric\",
        \"x\": 0,
        \"y\": 0,
        \"width\": 12,
        \"height\": 6,
        \"properties\": {
          \"metrics\": [
            [\"AWS/RDS\", \"CPUUtilization\", \"DBInstanceIdentifier\", \"offme-postgres\"],
            [\".\", \"DatabaseConnections\", \".\", \".\"],
            [\".\", \"FreeStorageSpace\", \".\", \".\"]
          ],
          \"period\": 300,
          \"stat\": \"Average\",
          \"region\": \"us-east-1\",
          \"title\": \"PostgreSQL Metrics\"
        }
      }
    ]
  }'"

echo ""
echo -e "${GREEN}Option B: GCP Cloud Monitoring${NC}"
echo "gcloud monitoring dashboards create \\
  --config-from-file=offme-dashboard.json"

echo ""
echo -e "${GREEN}Option C: Azure Monitor${NC}"
echo "az monitor metrics alert create \\
  --name OffMe-HighCPU \\
  --resource-group offme-rg \\
  --scopes /subscriptions/.../resourceGroups/offme-rg/providers/Microsoft.DBforPostgreSQL/servers/offme-postgres \\
  --condition \"avg CPU Percentage > 80 over 5m\" \\
  --description \"High CPU on PostgreSQL\" \\
  --severity 2 \\
  --action-group /subscriptions/.../resourceGroups/offme-rg/providers/microsoft.insights/actionGroups/offme-ag"

echo ""

# Step 7: Configure CI/CD (GitHub Actions/GitLab CI)
echo -e "${YELLOW}Step 7: Configuring CI/CD${NC}"
echo -e "${GREEN}Option A: GitHub Actions${NC}"
echo "# .github/workflows/backend-deploy.yml
name: Backend Deploy

on:
  push:
    branches: [ main ]
    paths:
      - 'backend-scala/**'
      - 'schemas/**'

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          java-version: '21'
          distribution: 'temurin'

      - name: Build and Test
        run: |
          cd backend-scala
          sbt clean compile test

      - name: Build Docker Images
        run: |
          cd backend-scala
          sbt docker:publishLocal

      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f k8s/

      - name: Run Database Migrations
        run: |
          psql \$DB_URL -f schemas/postgres/001_init.sql
          cqlsh \$CASSANDRA_HOSTS -f schemas/cassandra/001_init.cql"

echo ""
echo -e "${GREEN}Option B: GitLab CI${NC}"
echo "# .gitlab-ci.yml
stages:
  - build
  - test
  - deploy

variables:
  DOCKER_HOST: tcp://docker:2375
  DOCKER_DRIVER: overlay2

build:
  stage: build
  image: eclipse-temurin:21-jdk
  script:
    - cd backend-scala
    - sbt clean compile
  artifacts:
    paths:
      - backend-scala/target/

test:
  stage: test
  image: eclipse-temurin:21-jdk
  script:
    - cd backend-scala
    - sbt test

deploy:
  stage: deploy
  image: alpine/k8s:1.27.4
  script:
    - kubectl apply -f k8s/
  only:
    - main"

echo ""
echo -e "${GREEN}Option C: Azure DevOps${NC}"
echo "# azure-pipelines.yml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - backend-scala/*
      - schemas/*

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: JavaToolInstaller@0
  inputs:
    versionSpec: '21'
    jdkArchitectureOption: 'x64'
    jdkSourceOption: 'PreInstalled'

- script: |
    cd backend-scala
    sbt clean compile test
  displayName: 'Build and Test'

- script: |
    cd backend-scala
    sbt docker:publishLocal
  displayName: 'Build Docker Images'

- task: KubernetesManifest@0
  inputs:
    action: 'deploy'
    kubernetesServiceConnection: 'offme-k8s'
    namespace: 'offme'
    manifests: 'k8s/*.yml'
  displayName: 'Deploy to AKS'"

echo ""

echo -e "${GREEN}==> Cloud Infrastructure Setup Complete! ✅${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Choose your cloud provider (AWS/GCP/Azure)"
echo "2. Run the appropriate commands for each service"
echo "3. Configure Kubernetes manifests in k8s/ directory"
echo "4. Set up CI/CD pipeline"
echo "5. Configure monitoring and alerts"
echo ""
echo -e "${GREEN}Cloud infrastructure is ready for production! 🎉${NC}"