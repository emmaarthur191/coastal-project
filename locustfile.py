from locust import HttpUser, task, between
import json

class BankingUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        """Login and get access token on start"""
        response = self.client.post("/api/users/login/", json={
            "email": "test@example.com",
            "password": "testpass123"
        })
        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get("access")
            self.client.headers.update({"Authorization": f"Bearer {self.access_token}"})

    @task(3)
    def get_accounts(self):
        self.client.get("/api/accounts/")

    @task(2)
    def get_transactions(self):
        self.client.get("/api/transactions/")

    @task(1)
    def get_loans(self):
        self.client.get("/api/loans/")

    @task(1)
    def get_fraud_alerts(self):
        self.client.get("/api/fraud-alerts/")

    @task(2)
    def get_messages(self):
        self.client.get("/api/messages/")

    @task(1)
    def create_transaction(self):
        self.client.post("/api/transactions/", json={
            "account": 1,
            "amount": 100.00,
            "transaction_type": "deposit",
            "description": "Load test deposit"
        })

    @task(1)
    def get_user_profile(self):
        self.client.get("/api/users/me/")

    @task(1)
    def get_system_health(self):
        self.client.get("/api/performance/system-health/")

    @task(1)
    def get_operational_metrics(self):
        self.client.get("/api/operations/metrics/")
