# Rollback Plan

## Overview
This document outlines the procedures for rolling back deployments in case of issues with new releases.

## Types of Rollbacks

### 1. Application Rollback (Blue-Green)
For backend/frontend application issues:

1. **Identify Active Environment**
   ```bash
   kubectl get service frontend-service -n banking-app -o jsonpath='{.spec.selector.color}'
   ```

2. **Switch Traffic Back**
   If current is green, switch to blue:
   ```bash
   kubectl patch service frontend-service -n banking-app -p '{"spec":{"selector":{"app":"frontend-blue"}}}'
   kubectl patch service backend-service -n banking-app -p '{"spec":{"selector":{"app":"backend-blue"}}}'
   ```

3. **Scale Down Failed Deployment**
   ```bash
   kubectl scale deployment frontend-green -n banking-app --replicas=0
   kubectl scale deployment backend-green -n banking-app --replicas=0
   ```

4. **Verify Rollback**
   - Check application health
   - Monitor error rates
   - Confirm user access

### 2. Database Rollback
For database schema issues:

1. **Restore from Backup**
   ```bash
   # List available backups
   kubectl exec -n banking-app -it $(kubectl get pods -n banking-app -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- ls /backup/

   # Restore specific backup
   kubectl exec -n banking-app -it $(kubectl get pods -n banking-app -l app=postgres -o jsonpath='{.items[0].metadata.name}') -- bash -c "psql -U banking_user -d banking_db < /backup/backup-20231211-020000.sql"
   ```

2. **Rollback Migration**
   If using Django migrations:
   ```bash
   kubectl exec -n banking-app -it $(kubectl get pods -n banking-app -l app=backend -o jsonpath='{.items[0].metadata.name}') -- python manage.py migrate <app> <previous_migration>
   ```

### 3. Infrastructure Rollback
For Kubernetes manifest issues:

1. **Revert to Previous Manifests**
   ```bash
   git checkout <previous_commit> -- k8s/
   kubectl apply -f k8s/
   ```

2. **Check Pod Status**
   ```bash
   kubectl get pods -n banking-app
   kubectl describe pod <failed-pod> -n banking-app
   ```

## Automated Rollback (Future Enhancement)
- Implement canary deployments with automatic rollback on failure
- Use ArgoCD or Flux for GitOps-based rollbacks
- Set up alerts for automatic rollback triggers

## Monitoring During Rollback
- Watch application metrics in Grafana
- Monitor error logs in Kibana
- Check Kubernetes events: `kubectl get events -n banking-app`

## Communication Plan
1. Notify team via Slack/Teams
2. Update status page if applicable
3. Communicate with users if service disruption expected

## Post-Rollback Actions
1. Root cause analysis
2. Fix identified issues
3. Test fixes in staging
4. Plan next deployment with additional safeguards
