import os
import sys
import django
from pathlib import Path

# Add the parent directory of config to sys.path
backend_path = Path(__file__).resolve().parent.parent / 'banking_backend'
sys.path.insert(0, str(backend_path))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from core.models.reporting import ReportTemplate

def seed_templates():
    templates = [
        {
            "name": "Daily Transaction Summary",
            "report_type": "transactions",
            "description": "Consolidated summary of all deposits and withdrawals for the day.",
            "is_active": True
        },
        {
            "name": "Monthly Loan Disbursement Report",
            "report_type": "loans",
            "description": "Detailed report of all loans approved and disbursed in the current month.",
            "is_active": True
        },
        {
            "name": "Security Audit Log",
            "report_type": "audit_logs",
            "description": "Trail of all administrative actions and security-sensitive operations.",
            "is_active": True
        }
    ]

    for t in templates:
        obj, created = ReportTemplate.objects.get_or_create(
            name=t["name"],
            defaults={
                "report_type": t["report_type"],
                "description": t["description"],
                "is_active": t["is_active"]
            }
        )
        if created:
            print(f"Created template: {obj.name}")
        else:
            print(f"Template already exists: {obj.name}")

if __name__ == "__main__":
    seed_templates()
