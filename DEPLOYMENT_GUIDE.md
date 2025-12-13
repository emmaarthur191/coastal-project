# Production Deployment Guide

## Overview
This guide covers the production deployment of the Banking Backend and Frontend applications using Docker, Kubernetes, CI/CD, monitoring, and security best practices.

## Prerequisites
- Kubernetes cluster (e.g., DigitalOcean Kubernetes)
- kubectl configured
- Docker registry access
- Domain names configured

## Architecture
- **Backend**: Django REST API with PostgreSQL, Redis, Celery
- **Frontend**: React/Vite application
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Kibana)
- **CI/CD**: GitHub Actions with staging/production environments

## Deployment Steps

### 1. Build and Push Images
Images are automatically built and pushed via GitHub Actions on push to main branch.

### 2. Deploy to Kubernetes
```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/redis.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/celery.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/prometheus.yaml
kubectl apply -f k8s/grafana.yaml
kubectl apply -f k8s/elasticsearch.yaml
kubectl apply -f k8s/kibana.yaml
kubectl apply -f k8s/networkpolicy.yaml
kubectl apply -f k8s/backup.yaml
```

### 3. Configure DNS
Point your domains to the ingress load balancer:
- `banking-app.com` -> Frontend
- `api.banking-app.com` -> Backend API

### 4. SSL Certificates
Certificates are automatically provisioned via cert-manager and Let's Encrypt.

### 5. Access Services
- Frontend: https://banking-app.com
- API: https://api.banking-app.com
- Grafana: https://grafana.banking-app.com (configure ingress)
- Kibana: https://kibana.banking-app.com (configure ingress)
- Flower: Internal service for Celery monitoring

## Monitoring
- Prometheus: http://prometheus-service.banking-app.svc.cluster.local:9090
- Grafana: http://grafana-service.banking-app.svc.cluster.local:3000 (admin/admin)

## Logging
- Elasticsearch: http://elasticsearch-service.banking-app.svc.cluster.local:9200
- Kibana: http://kibana-service.banking-app.svc.cluster.local:5601

## Backup
- PostgreSQL backups run daily at 2 AM
- Backups stored in `backup-pvc` PVC

## Security
- Network policies restrict pod-to-pod communication
- SSL/TLS encryption for all external traffic
- Secrets management via Kubernetes secrets

## Rollback Plan
1. Identify the problematic deployment
2. Scale down the current deployment
3. Scale up the previous working deployment
4. Update ingress/service selectors if needed
5. Monitor and verify rollback success

## Troubleshooting
- Check pod logs: `kubectl logs -n banking-app <pod-name>`
- Check service endpoints: `kubectl get endpoints -n banking-app`
- Health checks: All services have readiness/liveness probes