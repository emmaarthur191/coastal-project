# Coastal Banking - Review Recommendations & Solutions

**Purpose**: Address the B/B- grades from the app review with industry-leading solutions.

---

## 📋 Review Summary

| Area | Current Grade | Issues Identified |
|------|---------------|-------------------|
| **Innovation** | B | No biometric auth, rule-based fraud only, no ZKP, no mobile security |
| **Data & Infra** | B- | Vague ETL/ClickHouse, no RTO/RPO metrics, no multi-AZ |
| **Testing** | B | No fuzzing, no chaos engineering, coverage not enforced in CI |

---

## 🔐 1. Advanced Authentication (Biometric/Passwordless)

### Recommended Solution: WebAuthn/FIDO2 + Passkeys

**Libraries:**
- `django-mfa2` - Full MFA support including FIDO2
- `django-passkeys` - Focused WebAuthn/Passkeys implementation
- `py_webauthn` - Low-level WebAuthn server implementation

**Implementation Steps:**
```bash
pip install django-mfa2 py_webauthn
```

**Django Configuration:**
```python
# settings.py
INSTALLED_APPS += ['mfa']
MFA_UNALLOWED_METHODS = ()  # Allow all methods
MFA_FIDO_ENABLED = True

# urls.py
urlpatterns += [
    path('mfa/', include('mfa.urls')),
]
```

**Frontend (React):**
```javascript
// Registration
const credential = await navigator.credentials.create({
  publicKey: registrationOptions
});

// Authentication
const assertion = await navigator.credentials.get({
  publicKey: authenticationOptions
});
```

**Benefits:**
- ✅ Fingerprint, Face ID, Windows Hello support
- ✅ Phishing-resistant (cryptographic challenge)
- ✅ Works on all modern browsers
- ✅ Aligns with Ghana BoG digital banking guidelines

---

## 🤖 2. ML-Based Fraud Detection

### Recommended Solution: Isolation Forest + LSTM for Anomaly Detection

**Libraries:**
- `scikit-learn` - Isolation Forest, One-Class SVM
- `tensorflow/keras` - LSTM for sequential pattern detection
- `finomaly` - Purpose-built financial anomaly detection

**Architecture:**
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Transaction    │────▶│  Feature        │────▶│  ML Models      │
│  Stream         │     │  Engineering    │     │  (Ensemble)     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                        ┌────────────────────────────────┼────────────────────────────────┐
                        │                                │                                │
                        ▼                                ▼                                ▼
               ┌─────────────────┐              ┌─────────────────┐              ┌─────────────────┐
               │                 │              │                 │              │                 │
               │ Isolation Forest│              │ LSTM Autoencoder│              │ Behavioral      │
               │ (Outlier)       │              │ (Sequential)    │              │ Clustering      │
               └─────────────────┘              └─────────────────┘              └─────────────────┘
```

**Implementation:**
```python
# core/ml/fraud_detector.py
from sklearn.ensemble import IsolationForest
import tensorflow as tf

class MLFraudDetector:
    def __init__(self):
        self.isolation_forest = IsolationForest(
            contamination=0.01,  # 1% expected fraud rate
            random_state=42
        )
        self.lstm_model = self._build_lstm()

    def _build_lstm(self):
        """LSTM Autoencoder for sequential anomaly detection"""
        model = tf.keras.Sequential([
            tf.keras.layers.LSTM(64, return_sequences=True, input_shape=(30, 5)),
            tf.keras.layers.LSTM(32, return_sequences=False),
            tf.keras.layers.Dense(32, activation='relu'),
            tf.keras.layers.Dense(5)
        ])
        model.compile(optimizer='adam', loss='mse')
        return model

    def extract_features(self, transaction):
        """Feature engineering for ML models"""
        return [
            transaction.amount,
            transaction.account.calculated_balance,
            self._time_since_last_transaction(transaction),
            self._daily_transaction_count(transaction),
            self._velocity_score(transaction)
        ]

    def predict(self, transaction) -> dict:
        features = self.extract_features(transaction)

        # Ensemble prediction
        iso_score = self.isolation_forest.decision_function([features])[0]
        lstm_score = self.lstm_model.predict([features], verbose=0)[0]

        return {
            'is_anomaly': iso_score < -0.5 or lstm_score > 0.8,
            'risk_score': (abs(iso_score) + lstm_score) / 2,
            'model_contributions': {
                'isolation_forest': iso_score,
                'lstm_autoencoder': lstm_score
            }
        }
```

**Training Pipeline (Celery task):**
```python
@celery_app.task
def retrain_fraud_models():
    """Weekly retraining with new transaction data"""
    transactions = Transaction.objects.filter(
        timestamp__gte=timezone.now() - timedelta(days=90)
    )
    # Extract features and retrain
    ...
```

---

## 📱 3. Mobile App Security

### Recommended Solution: Certificate Pinning + Secure Storage

**For React Native:**
```bash
npm install react-native-ssl-pinning react-native-keychain
```

**Certificate Pinning:**
```javascript
// services/secureApi.ts
import { fetch as sslFetch } from 'react-native-ssl-pinning';

export const secureApi = async (endpoint: string, options: any) => {
  return sslFetch(endpoint, {
    ...options,
    sslPinning: {
      certs: ['coastal_cert'],  // SHA256 hash of certificate
    },
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
    },
  });
};
```

**Android (Network Security Config):**
```xml
<!-- res/xml/network_security_config.xml -->
<network-security-config>
    <domain-config>
        <domain includeSubdomains="true">coastal-project.onrender.com</domain>
        <pin-set expiration="2025-12-31">
            <pin digest="SHA-256">YOUR_CERT_HASH_HERE</pin>
            <pin digest="SHA-256">BACKUP_CERT_HASH_HERE</pin>
        </pin-set>
    </domain-config>
</network-security-config>
```

**iOS (TrustKit via Podfile):**
```ruby
pod 'TrustKit'
```

**Secure Storage:**
```javascript
import * as Keychain from 'react-native-keychain';

// Store sensitive data
await Keychain.setGenericPassword('tokens', JSON.stringify({
  access: accessToken,
  refresh: refreshToken
}));

// Retrieve
const credentials = await Keychain.getGenericPassword();
```

---

## 🧪 4. Security Fuzzing

### Recommended Solution: Atheris + Hypothesis

**Installation:**
```bash
pip install atheris hypothesis
```

**Fuzzing API Inputs:**
```python
# tests/fuzz/test_transaction_fuzz.py
import atheris
import sys

def fuzz_transaction_input(data):
    """Fuzz test transaction creation endpoint"""
    from core.serializers import TransactionSerializer

    fdp = atheris.FuzzedDataProvider(data)

    try:
        serializer = TransactionSerializer(data={
            'amount': fdp.ConsumeFloatInRange(-1e10, 1e10),
            'transaction_type': fdp.ConsumeString(50),
            'description': fdp.ConsumeString(500),
        })
        serializer.is_valid()
    except Exception as e:
        # Only fail on unexpected exceptions
        if not isinstance(e, (ValueError, TypeError, ValidationError)):
            raise

if __name__ == '__main__':
    atheris.Setup(sys.argv, fuzz_transaction_input)
    atheris.Fuzz()
```

**Hypothesis Property-Based Testing:**
```python
# tests/test_properties.py
from hypothesis import given, strategies as st

@given(
    amount=st.decimals(min_value=0, max_value=1000000),
    account_type=st.sampled_from(['daily_susu', 'shares', 'monthly_contribution'])
)
def test_deposit_never_reduces_balance(amount, account_type):
    """Property: A deposit should never reduce account balance"""
    account = Account.objects.create(account_type=account_type)
    initial_balance = account.balance

    TransactionService.deposit(account, amount)

    assert account.balance >= initial_balance
```

---

## 🌪️ 5. Chaos Engineering

### Recommended Solution: LitmusChaos for Kubernetes

**Installation:**
```bash
# Install LitmusChaos
kubectl apply -f https://litmuschaos.github.io/litmus/3.0.0/litmus-3.0.0.yaml

# Install experiment hub
kubectl apply -f https://hub.litmuschaos.io/api/chaos/3.0.0?file=kube-aws
```

**Pod Failure Experiment:**
```yaml
# k8s/chaos/pod-delete-experiment.yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: banking-pod-chaos
  namespace: banking-app
spec:
  appinfo:
    appns: 'banking-app'
    applabel: 'app=backend'
    appkind: 'deployment'
  engineState: 'active'
  chaosServiceAccount: litmus-admin
  experiments:
    - name: pod-delete
      spec:
        components:
          env:
            - name: TOTAL_CHAOS_DURATION
              value: '60'
            - name: CHAOS_INTERVAL
              value: '10'
            - name: FORCE
              value: 'false'
```

**Network Delay Experiment:**
```yaml
# k8s/chaos/network-delay-experiment.yaml
apiVersion: litmuschaos.io/v1alpha1
kind: ChaosEngine
metadata:
  name: network-chaos
  namespace: banking-app
spec:
  appinfo:
    appns: 'banking-app'
    applabel: 'app=backend'
  experiments:
    - name: pod-network-latency
      spec:
        components:
          env:
            - name: NETWORK_LATENCY
              value: '300'  # 300ms latency
            - name: TOTAL_CHAOS_DURATION
              value: '120'
```

---

## 📊 6. PostgreSQL → ClickHouse ETL

### Recommended Solution: PeerDB (CDC) + dbt

**Architecture:**
```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│                 │  CDC    │                 │  Sync   │                 │
│   PostgreSQL    │────────▶│     PeerDB      │────────▶│   ClickHouse    │
│   (OLTP)        │         │  (Replication)  │         │   (OLAP/DW)     │
│                 │         │                 │         │                 │
└─────────────────┘         └─────────────────┘         └────────┬────────┘
                                                                 │
                                                                 ▼
                                                        ┌─────────────────┐
                                                        │                 │
                                                        │   dbt Models    │
                                                        │ (Transforms)    │
                                                        │                 │
                                                        └─────────────────┘
```

**PeerDB Setup (Docker Compose):**
```yaml
# docker-compose.analytics.yml
services:
  peerdb:
    image: peerdb/peerdb:latest
    environment:
      SOURCE_TYPE: postgres
      SOURCE_HOST: postgres
      SOURCE_PORT: 5432
      SOURCE_DATABASE: coastal_banking
      DEST_TYPE: clickhouse
      DEST_HOST: clickhouse
      DEST_PORT: 8123
```

**dbt Transformation (Example Model):**
```sql
-- models/marts/finance/daily_transaction_summary.sql
{{ config(materialized='incremental', unique_key='date') }}

SELECT
    toDate(timestamp) as date,
    transaction_type,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM {{ source('banking', 'transactions') }}
{% if is_incremental() %}
WHERE timestamp > (SELECT MAX(timestamp) FROM {{ this }})
{% endif %}
GROUP BY date, transaction_type
```

---

## ⏱️ 7. RTO/RPO Metrics & Multi-AZ

### Disaster Recovery Plan:

| Metric | Target | Strategy |
|--------|--------|----------|
| **RPO** (Recovery Point Objective) | 15 minutes | Continuous PostgreSQL streaming replication |
| **RTO** (Recovery Time Objective) | 30 minutes | Automated failover with health checks |

**Multi-AZ Setup (AWS):**
```yaml
# k8s/database/postgres-ha.yaml
apiVersion: crunchydata.com/v1beta1
kind: PostgresCluster
metadata:
  name: coastal-postgres
spec:
  instances:
    - name: primary
      dataVolumeClaimSpec:
        storageClassName: gp3
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 100Gi
      affinity:
        podAntiAffinity:
          requiredDuringSchedulingIgnoredDuringExecution:
            - labelSelector:
                matchExpressions:
                  - key: postgres-operator.crunchydata.com/cluster
                    operator: In
                    values: ["coastal-postgres"]
              topologyKey: topology.kubernetes.io/zone
  replicas: 3  # 1 primary + 2 replicas across AZs
```

---

## ✅ 8. Enforce Code Coverage in CI

**GitHub Actions Update:**
```yaml
# .github/workflows/main.yml
- name: Run tests with coverage
  run: |
    cd banking_backend
    pytest --cov=. --cov-report=xml --cov-fail-under=90

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./banking_backend/coverage.xml
    fail_ci_if_error: true

- name: Coverage Gate
  run: |
    COVERAGE=$(python -c "import xml.etree.ElementTree as ET; tree = ET.parse('coverage.xml'); print(float(tree.find('.//coverage').get('line-rate')) * 100)")
    echo "Coverage: $COVERAGE%"
    if (( $(echo "$COVERAGE < 90" | bc -l) )); then
      echo "❌ Coverage below 90%"
      exit 1
    fi
```

---

## 📈 Implementation Roadmap

| Phase | Features | Timeline | Priority |
|-------|----------|----------|----------|
| **Phase 1** | CI Coverage Enforcement, Fuzzing | Week 1-2 | 🔴 High |
| **Phase 2** | ML Fraud Detection (Isolation Forest) | Week 3-4 | 🔴 High |
| **Phase 3** | WebAuthn/Biometric Auth | Week 5-6 | 🟡 Medium |
| **Phase 4** | LitmusChaos Setup | Week 7-8 | 🟡 Medium |
| **Phase 5** | PostgreSQL→ClickHouse ETL | Week 9-10 | 🟡 Medium |
| **Phase 6** | Mobile Security (if applicable) | Week 11-12 | 🟢 Low |

---

## 💰 Cost Considerations

| Feature | Tool | Cost |
|---------|------|------|
| ML Fraud Detection | TensorFlow | Free (OSS) |
| Biometric Auth | django-mfa2 | Free (OSS) |
| Chaos Engineering | LitmusChaos | Free (OSS) |
| ETL/CDC | PeerDB | Free (OSS) |
| ClickHouse | Self-hosted | ~$50/mo (small instance) |
| Coverage (Codecov) | Free tier | Free for OSS |

---

*Document generated based on research from industry best practices and 2024 tooling recommendations.*
