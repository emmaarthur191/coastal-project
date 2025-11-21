# AWS Deployment Guide for Banking Backend

This guide provides step-by-step instructions for deploying the Banking Backend application to AWS using various services.

## Table of Contents

1. [AWS Services Overview](#aws-services-overview)
2. [Prerequisites](#prerequisites)
3. [Deployment Options](#deployment-options)
4. [Option 1: AWS ECS with Fargate](#option-1-aws-ecs-with-fargate)
5. [Option 2: AWS Elastic Beanstalk](#option-2-aws-elastic-beanstalk)
6. [Option 3: AWS EC2 with Docker](#option-3-aws-ec2-with-docker)
7. [Database Setup (RDS)](#database-setup-rds)
8. [Redis Setup (ElastiCache)](#redis-setup-elasticache)
9. [S3 Configuration](#s3-configuration)
10. [CloudFront CDN Setup](#cloudfront-cdn-setup)
11. [Security Configuration](#security-configuration)
12. [Monitoring and Logging](#monitoring-and-logging)
13. [CI/CD Pipeline](#cicd-pipeline)
14. [Cost Optimization](#cost-optimization)

## AWS Services Overview

### Recommended Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         AWS Cloud                            │
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │   Route 53   │──────│     ALB      │                    │
│  │     DNS      │      │ Load Balancer│                    │
│  └──────────────┘      └──────┬───────┘                    │
│                               │                             │
│                    ┌──────────┴──────────┐                 │
│                    │                     │                 │
│            ┌───────▼────────┐   ┌───────▼────────┐        │
│            │   ECS Fargate  │   │   ECS Fargate  │        │
│            │   Container 1  │   │   Container 2  │        │
│            └───────┬────────┘   └───────┬────────┘        │
│                    │                     │                 │
│         ┌──────────┴─────────────────────┴──────┐         │
│         │                                        │         │
│    ┌────▼─────┐  ┌──────────┐  ┌──────────┐   │         │
│    │   RDS    │  │ElastiCache│  │    S3    │   │         │
│    │PostgreSQL│  │   Redis   │  │  Storage │   │         │
│    └──────────┘  └──────────┘  └──────────┘   │         │
│                                                 │         │
│    ┌──────────────────────────────────────────┐│         │
│    │         CloudWatch Monitoring            ││         │
│    └──────────────────────────────────────────┘│         │
└─────────────────────────────────────────────────┘         │
```

## Prerequisites

### Required Tools

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install ECS CLI
sudo curl -Lo /usr/local/bin/ecs-cli https://amazon-ecs-cli.s3.amazonaws.com/ecs-cli-linux-amd64-latest
sudo chmod +x /usr/local/bin/ecs-cli

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
```

### AWS Account Setup

1. Create an AWS account at https://aws.amazon.com
2. Set up IAM user with appropriate permissions
3. Configure AWS CLI:

```bash
aws configure
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region name: us-east-1
# Default output format: json
```

## Deployment Options

### Option 1: AWS ECS with Fargate (Recommended)

**Pros:**
- Serverless container management
- Auto-scaling
- No server management
- Pay only for what you use

**Cons:**
- Higher cost per container hour
- Less control over underlying infrastructure

### Option 2: AWS Elastic Beanstalk

**Pros:**
- Easiest deployment
- Automatic scaling
- Integrated monitoring

**Cons:**
- Less flexibility
- Limited customization

### Option 3: AWS EC2 with Docker

**Pros:**
- Full control
- Cost-effective for steady workloads
- Maximum flexibility

**Cons:**
- Manual server management
- More complex setup

## Option 1: AWS ECS with Fargate

### Step 1: Create ECR Repository

```bash
# Create ECR repository
aws ecr create-repository --repository-name banking-backend --region us-east-1

# Get login command
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

# Build and push image
docker build -t banking-backend -f Dockerfile.prod .
docker tag banking-backend:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/banking-backend:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/banking-backend:latest
```

### Step 2: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name banking-cluster --region us-east-1
```

### Step 3: Create Task Definition

Create `ecs-task-definition.json`:

```json
{
  "family": "banking-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "banking-backend",
      "image": "YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/banking-backend:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "ENVIRONMENT", "value": "production"},
        {"name": "DEBUG", "value": "False"}
      ],
      "secrets": [
        {"name": "SECRET_KEY", "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:banking/SECRET_KEY"},
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:banking/DATABASE_URL"},
        {"name": "REDIS_URL", "valueFrom": "arn:aws:secretsmanager:us-east-1:YOUR_ACCOUNT_ID:secret:banking/REDIS_URL"}
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/banking-backend",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health/ || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

Register task definition:

```bash
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json
```

### Step 4: Create Application Load Balancer

```bash
# Create security group for ALB
aws ec2 create-security-group \
  --group-name banking-alb-sg \
  --description "Security group for Banking ALB" \
  --vpc-id YOUR_VPC_ID

# Allow HTTP and HTTPS
aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 80 \
  --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-id sg-xxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# Create ALB
aws elbv2 create-load-balancer \
  --name banking-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-xxxxx \
  --scheme internet-facing \
  --type application

# Create target group
aws elbv2 create-target-group \
  --name banking-tg \
  --protocol HTTP \
  --port 8000 \
  --vpc-id YOUR_VPC_ID \
  --target-type ip \
  --health-check-path /health/

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Step 5: Create ECS Service

```bash
aws ecs create-service \
  --cluster banking-cluster \
  --service-name banking-service \
  --task-definition banking-backend:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=banking-backend,containerPort=8000"
```

## Database Setup (RDS)

### Create PostgreSQL RDS Instance

```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name banking-db-subnet \
  --db-subnet-group-description "Banking DB Subnet Group" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create security group for RDS
aws ec2 create-security-group \
  --group-name banking-rds-sg \
  --description "Security group for Banking RDS" \
  --vpc-id YOUR_VPC_ID

# Allow PostgreSQL from ECS security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-rds-xxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-ecs-xxxxx

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier banking-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.3 \
  --master-username admin \
  --master-user-password YOUR_SECURE_PASSWORD \
  --allocated-storage 100 \
  --storage-type gp3 \
  --storage-encrypted \
  --vpc-security-group-ids sg-rds-xxxxx \
  --db-subnet-group-name banking-db-subnet \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --multi-az \
  --publicly-accessible false
```

### Run Migrations

```bash
# Get RDS endpoint
aws rds describe-db-instances \
  --db-instance-identifier banking-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text

# Run migrations via ECS task
aws ecs run-task \
  --cluster banking-cluster \
  --task-definition banking-backend:1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
  --overrides '{"containerOverrides":[{"name":"banking-backend","command":["python","manage.py","migrate"]}]}'
```

## Redis Setup (ElastiCache)

```bash
# Create cache subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name banking-cache-subnet \
  --cache-subnet-group-description "Banking Cache Subnet Group" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create security group for ElastiCache
aws ec2 create-security-group \
  --group-name banking-redis-sg \
  --description "Security group for Banking Redis" \
  --vpc-id YOUR_VPC_ID

# Allow Redis from ECS security group
aws ec2 authorize-security-group-ingress \
  --group-id sg-redis-xxxxx \
  --protocol tcp \
  --port 6379 \
  --source-group sg-ecs-xxxxx

# Create Redis cluster
aws elasticache create-replication-group \
  --replication-group-id banking-redis \
  --replication-group-description "Banking Redis Cluster" \
  --engine redis \
  --engine-version 7.0 \
  --cache-node-type cache.t3.medium \
  --num-cache-clusters 2 \
  --automatic-failover-enabled \
  --cache-subnet-group-name banking-cache-subnet \
  --security-group-ids sg-redis-xxxxx \
  --at-rest-encryption-enabled \
  --transit-encryption-enabled \
  --auth-token YOUR_REDIS_PASSWORD
```

## S3 Configuration

### Create S3 Buckets

```bash
# Create bucket for static files
aws s3 mb s3://banking-static-files --region us-east-1

# Create bucket for media files
aws s3 mb s3://banking-media-files --region us-east-1

# Create bucket for backups
aws s3 mb s3://banking-backups --region us-east-1

# Enable versioning on backup bucket
aws s3api put-bucket-versioning \
  --bucket banking-backups \
  --versioning-configuration Status=Enabled

# Set lifecycle policy for backups
cat > lifecycle-policy.json <<EOF
{
  "Rules": [
    {
      "Id": "DeleteOldBackups",
      "Status": "Enabled",
      "Prefix": "database/",
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket banking-backups \
  --lifecycle-configuration file://lifecycle-policy.json

# Set CORS policy for static files
cat > cors-policy.json <<EOF
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://your-domain.com"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

aws s3api put-bucket-cors \
  --bucket banking-static-files \
  --cors-configuration file://cors-policy.json
```

### Configure Django for S3

Add to `requirements.txt`:
```
boto3==1.28.0
django-storages==1.14.0
```

Add to `settings.py`:
```python
# AWS S3 Configuration
if ENVIRONMENT == 'production':
    AWS_ACCESS_KEY_ID = config('AWS_ACCESS_KEY_ID')
    AWS_SECRET_ACCESS_KEY = config('AWS_SECRET_ACCESS_KEY')
    AWS_STORAGE_BUCKET_NAME = config('AWS_STORAGE_BUCKET_NAME', default='banking-static-files')
    AWS_S3_REGION_NAME = config('AWS_S3_REGION_NAME', default='us-east-1')
    AWS_S3_CUSTOM_DOMAIN = f'{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com'
    AWS_S3_OBJECT_PARAMETERS = {
        'CacheControl': 'max-age=86400',
    }
    
    # Static files
    STATICFILES_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    STATIC_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/static/'
    
    # Media files
    DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
    MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/media/'
```

## CloudFront CDN Setup

```bash
# Create CloudFront distribution
aws cloudfront create-distribution \
  --distribution-config file://cloudfront-config.json
```

`cloudfront-config.json`:
```json
{
  "CallerReference": "banking-cdn-2024",
  "Comment": "Banking Application CDN",
  "Enabled": true,
  "Origins": {
    "Quantity": 2,
    "Items": [
      {
        "Id": "S3-banking-static",
        "DomainName": "banking-static-files.s3.amazonaws.com",
        "S3OriginConfig": {
          "OriginAccessIdentity": ""
        }
      },
      {
        "Id": "ALB-banking-backend",
        "DomainName": "banking-alb-xxxxx.us-east-1.elb.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      }
    ]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "ALB-banking-backend",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 7,
      "Items": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    },
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {"Forward": "all"},
      "Headers": {
        "Quantity": 3,
        "Items": ["Host", "Authorization", "CloudFront-Forwarded-Proto"]
      }
    }
  },
  "CacheBehaviors": {
    "Quantity": 1,
    "Items": [
      {
        "PathPattern": "/static/*",
        "TargetOriginId": "S3-banking-static",
        "ViewerProtocolPolicy": "redirect-to-https",
        "Compress": true,
        "DefaultTTL": 86400
      }
    ]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "arn:aws:acm:us-east-1:YOUR_ACCOUNT_ID:certificate/xxxxx",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  }
}
```

## Security Configuration

### AWS Secrets Manager

```bash
# Store secrets
aws secretsmanager create-secret \
  --name banking/SECRET_KEY \
  --secret-string "your-production-secret-key"

aws secretsmanager create-secret \
  --name banking/DATABASE_URL \
  --secret-string "postgresql://user:pass@rds-endpoint:5432/banking_db"

aws secretsmanager create-secret \
  --name banking/REDIS_URL \
  --secret-string "redis://redis-endpoint:6379/0"

aws secretsmanager create-secret \
  --name banking/ENCRYPTION_KEY \
  --secret-string "your-32-character-encryption-key"
```

### WAF Configuration

```bash
# Create WAF Web ACL
aws wafv2 create-web-acl \
  --name banking-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json \
  --visibility-config SampledRequestsEnabled=true,CloudWatchMetricsEnabled=true,MetricName=BankingWAF

# Associate with ALB
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:... \
  --resource-arn arn:aws:elasticloadbalancing:...
```

## Monitoring and Logging

### CloudWatch Setup

```bash
# Create log group
aws logs create-log-group --log-group-name /ecs/banking-backend

# Create metric alarms
aws cloudwatch put-metric-alarm \
  --alarm-name banking-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

aws cloudwatch put-metric-alarm \
  --alarm-name banking-high-memory \
  --alarm-description "Alert when memory exceeds 80%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

### X-Ray Tracing

Add to `requirements.txt`:
```
aws-xray-sdk==2.12.0
```

Add to `settings.py`:
```python
if ENVIRONMENT == 'production':
    INSTALLED_APPS += ['aws_xray_sdk.ext.django']
    MIDDLEWARE.insert(0, 'aws_xray_sdk.ext.django.middleware.XRayMiddleware')
```

## CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy-aws.yml`:

```yaml
name: Deploy to AWS

on:
  push:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY: banking-backend
  ECS_CLUSTER: banking-cluster
  ECS_SERVICE: banking-service
  ECS_TASK_DEFINITION: ecs-task-definition.json

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1

      - name: Build, tag, and push image to Amazon ECR
        id: build-image
        env:
          ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
          IMAGE_TAG: ${{ github.sha }}
        run: |
          docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG -f Dockerfile.prod .
          docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
          echo "image=$ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG" >> $GITHUB_OUTPUT

      - name: Fill in the new image ID in the Amazon ECS task definition
        id: task-def
        uses: aws-actions/amazon-ecs-render-task-definition@v1
        with:
          task-definition: ${{ env.ECS_TASK_DEFINITION }}
          container-name: banking-backend
          image: ${{ steps.build-image.outputs.image }}

      - name: Deploy Amazon ECS task definition
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: ${{ steps.task-def.outputs.task-definition }}
          service: ${{ env.ECS_SERVICE }}
          cluster: ${{ env.ECS_CLUSTER }}
          wait-for-service-stability: true

      - name: Run database migrations
        run: |
          aws ecs run-task \
            --cluster ${{ env.ECS_CLUSTER }} \
            --task-definition ${{ steps.task-def.outputs.task-definition }} \
            --launch-type FARGATE \
            --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-xxxxx],assignPublicIp=ENABLED}" \
            --overrides '{"containerOverrides":[{"name":"banking-backend","command":["python","manage.py","migrate"]}]}'
```

## Cost Optimization

### Estimated Monthly Costs

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| ECS Fargate (2 tasks) | 1 vCPU, 2GB RAM | $60 |
| RDS PostgreSQL | db.t3.medium, Multi-AZ | $150 |
| ElastiCache Redis | cache.t3.medium, 2 nodes | $100 |
| ALB | Standard | $25 |
| S3 | 100GB storage, 1TB transfer | $30 |
| CloudFront | 1TB transfer | $85 |
| **Total** | | **~$450/month** |

### Cost Reduction Tips

1. **Use Reserved Instances** for RDS and ElastiCache (save up to 60%)
2. **Enable Auto Scaling** to scale down during low traffic
3. **Use S3 Intelligent-Tiering** for automatic cost optimization
4. **Implement CloudFront caching** to reduce origin requests
5. **Use Spot Instances** for non-critical workloads
6. **Set up billing alerts** to monitor costs

### Auto Scaling Configuration

```bash
# Register scalable target
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/banking-cluster/banking-service \
  --min-capacity 2 \
  --max-capacity 10

# Create scaling policy
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/banking-cluster/banking-service \
  --policy-name banking-cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

`scaling-policy.json`:
```json
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  },
  "ScaleInCooldown": 300,
  "ScaleOutCooldown": 60
}
```

## Troubleshooting

### Common Issues

1. **Task fails to start**
   - Check CloudWatch logs
   - Verify security group rules
   - Ensure secrets are accessible

2. **Database connection issues**
   - Verify RDS security group allows ECS security group
   - Check DATABASE_URL format
   - Ensure RDS is in same VPC

3. **High costs**
   - Review CloudWatch metrics
   - Check for unused resources
   - Optimize auto-scaling settings

### Useful Commands

```bash
# View ECS service events
aws ecs describe-services \
  --cluster banking-cluster \
  --services banking-service

# View CloudWatch logs
aws logs tail /ecs/banking-backend --follow

# Check task status
aws ecs list-tasks --cluster banking-cluster

# Describe task
aws ecs describe-tasks \
  --cluster banking-cluster \
  --tasks task-id
```

## Additional Resources

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS RDS Best Practices](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_BestPractices.html)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)

---

**Last Updated:** 2024-01-14
**Version:** 1.0.0