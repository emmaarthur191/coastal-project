# Rollback Plan

## Overview
This document outlines the procedures for rolling back deployments in case of issues with new releases.

## Types of Rollbacks

### 1. Application Rollback
Depending on how the cluster is managed, choose **Option A (Standard/Manual)** or **Option B (GitOps)**.

#### Option A: Standard Kubernetes Rollout (Manual Deployments)
If deployments are managed via manual `kubectl apply` or CI/CD pipelines:

1. **Check Rollout History**
   ```bash
   kubectl rollout history deployment/frontend -n banking-app
   ```
   ```bash
   kubectl rollout history deployment/backend -n banking-app
   ```

2. **Undo the Last Deployment**
   ```bash
   kubectl rollout undo deployment/frontend -n banking-app
   ```
   ```bash
   kubectl rollout undo deployment/backend -n banking-app
   ```

3. **Rollback to a Specific Revision**
   ```bash
   kubectl rollout undo deployment/frontend -n banking-app --to-revision=<revision_number>
   ```

4. **Verify Rollback**
   - Check application health
   - Monitor error rates
   - Confirm user access

#### Option B: GitOps Rollback (ArgoCD / Flux)
> [!WARNING]
> If the cluster is managed by a GitOps controller (e.g., ArgoCD or Flux), any manual `kubectl rollout undo` will be immediately reverted by the controller to match the Git state.
>
> **To roll back in GitOps:**
> 1. Revert the problematic commit on the `main` (or deployment) branch:
>    ```bash
>    git revert <commit_hash>
>    git push origin main
>    ```
> 2. Force an immediate sync in ArgoCD/Flux, or wait for the auto-sync interval.

### 2. Database Rollback
For database schema or data corruption issues:

> [!IMPORTANT]
> **Connection Lock Warning:** Before restoring, you must terminate all active database connections by scaling down the backend and background workers to `0`. If you do not do this, `pg_restore` will fail or hang due to active transaction locks.

#### Step 1: Scale Down Applications
```bash
kubectl scale deployment/backend -n banking-app --replicas=0
kubectl scale deployment/celery -n banking-app --replicas=0
```

#### Step 2: Execute the Restore
Choose **Option A (Automated Job)** or **Option B (Interactive Helper)**.

##### Option A: Run a One-Off Restore Job
1. Create `restore-job.yaml`:
   ```yaml
   apiVersion: batch/v1
   kind: Job
   metadata:
     name: postgres-restore
     namespace: banking-app
   spec:
     template:
       spec:
         restartPolicy: Never
         containers:
         - name: postgres-restore
           image: postgres:15
           env:
           - name: PGHOST
             value: postgres-service
           - name: PGPORT
             value: "5432"
           - name: PGDATABASE
             value: banking_db
           - name: PGUSER
             value: banking_user
           - name: PGPASSWORD
             valueFrom:
               secretKeyRef:
                 name: banking-secret
                 key: DATABASE_PASSWORD
           command:
           - /bin/sh
           - -c
           - |
             # Update YYYYMMDD_HHMMSS with the target backup file timestamp
             BACKUP_FILE="/backups/coastal_backup_YYYYMMDD_HHMMSS.dump"
             echo "Starting database restore from ${BACKUP_FILE}..."
             pg_restore -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE" --clean --if-exists -v "${BACKUP_FILE}"
           volumeMounts:
           - name: backup-storage
             mountPath: /backups
         volumes:
         - name: backup-storage
           persistentVolumeClaim:
             claimName: postgres-backup-pvc
   ```
2. Apply the job:
   ```bash
   kubectl apply -f restore-job.yaml
   ```
3. Monitor the logs:
   ```bash
   kubectl logs -n banking-app -l job-name=postgres-restore -f
   ```
4. Clean up the job:
   ```bash
   kubectl delete -f restore-job.yaml
   ```

##### Option B: Interactive Restore Helper Pod
1. Spin up an interactive pod mounting the backup PVC:
   ```bash
   kubectl run restore-helper --rm -i --tty --image=postgres:15 -n banking-app --overrides='
   {
     "spec": {
       "volumes": [
         {
           "name": "backup-storage",
           "persistentVolumeClaim": {
             "claimName": "postgres-backup-pvc"
           }
         }
       ],
       "containers": [
         {
           "name": "helper",
           "image": "postgres:15",
           "command": ["/bin/sh"],
           "stdin": true,
           "tty": true,
           "volumeMounts": [
             {
               "name": "backup-storage",
               "mountPath": "/backups"
             }
           ]
         }
       ]
     }
   }'
   ```
2. Inside the helper shell, list backups and run the restore:
   ```bash
   ls -lh /backups/
   pg_restore -h postgres-service -U banking_user -d banking_db --clean --if-exists -v /backups/coastal_backup_YYYYMMDD_HHMMSS.dump
   ```

#### Step 3: Scale Applications Back Up
Once the restore completes successfully, restore the application scaling:
```bash
kubectl scale deployment/backend -n banking-app --replicas=3
kubectl scale deployment/celery -n banking-app --replicas=2
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
