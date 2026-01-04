"""Seed data for cashier dashboard - Products and Report Templates.
Usage: python manage.py seed_cashier_data
"""

import datetime
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    help = "Seed initial data for Products, Report Templates, and Promotions"

    def handle(self, *args, **options):
        self.seed_products()
        self.seed_report_templates()
        self.seed_promotions()
        self.stdout.write(self.style.SUCCESS("Successfully seeded cashier dashboard data!"))

    def seed_products(self):
        from core.models import Product

        products = [
            {
                "name": "Daily Susu Savings",
                "product_type": "susu",
                "description": "Traditional daily savings account with flexible deposits. Perfect for small business owners and market traders.",
                "interest_rate": Decimal("5.00"),
                "minimum_balance": Decimal("10.00"),
                "features": ["Daily deposits", "No monthly fees", "Mobile access", "Instant withdrawals"],
            },
            {
                "name": "Premium Savings Account",
                "product_type": "savings",
                "description": "High-yield savings account for serious savers. Earn competitive interest rates on your balance.",
                "interest_rate": Decimal("8.50"),
                "minimum_balance": Decimal("500.00"),
                "maximum_balance": Decimal("1000000.00"),
                "features": ["High interest rate", "Free transfers", "ATM card", "Online banking"],
            },
            {
                "name": "Business Current Account",
                "product_type": "savings",
                "description": "Full-featured business account with overdraft facility and business tools.",
                "interest_rate": Decimal("2.00"),
                "minimum_balance": Decimal("1000.00"),
                "features": ["Checkbook", "Overdraft facility", "Business loans", "Multi-user access"],
            },
            {
                "name": "Personal Loan",
                "product_type": "loan",
                "description": "Flexible personal loans for any purpose. Competitive rates with easy repayment terms.",
                "interest_rate": Decimal("18.00"),
                "minimum_balance": Decimal("500.00"),
                "maximum_balance": Decimal("50000.00"),
                "features": ["Quick approval", "Flexible terms", "No collateral required", "Fixed rates"],
            },
            {
                "name": "Business Expansion Loan",
                "product_type": "loan",
                "description": "Grow your business with our competitive business loans. Extended repayment periods available.",
                "interest_rate": Decimal("15.00"),
                "minimum_balance": Decimal("5000.00"),
                "maximum_balance": Decimal("500000.00"),
                "features": ["Large amounts", "Extended terms", "Business advisory", "Competitive rates"],
            },
            {
                "name": "Life Insurance Plus",
                "product_type": "insurance",
                "description": "Comprehensive life insurance coverage with savings component.",
                "minimum_balance": Decimal("50.00"),
                "features": ["Death benefit", "Savings component", "Family coverage", "Disability protection"],
            },
            {
                "name": "Fixed Deposit Investment",
                "product_type": "investment",
                "description": "Lock in your savings for guaranteed returns. Terms from 3 to 24 months.",
                "interest_rate": Decimal("12.00"),
                "minimum_balance": Decimal("1000.00"),
                "features": ["Guaranteed returns", "Flexible terms", "Certificate issued", "Auto-renewal option"],
            },
        ]

        created_count = 0
        for product_data in products:
            product, created = Product.objects.get_or_create(name=product_data["name"], defaults=product_data)
            if created:
                created_count += 1

        self.stdout.write(f"  Created {created_count} products (skipped {len(products) - created_count} existing)")

    def seed_report_templates(self):
        from core.models import ReportTemplate

        templates = [
            {
                "name": "Daily Transaction Summary",
                "report_type": "transaction",
                "description": "Summary of all transactions processed during the day, grouped by type and cashier.",
                "default_parameters": {"date_range": "today", "group_by": "cashier"},
            },
            {
                "name": "Weekly Transaction Report",
                "report_type": "transaction",
                "description": "Comprehensive weekly report of all transaction activities.",
                "default_parameters": {"date_range": "week", "include_charts": True},
            },
            {
                "name": "Account Balance Report",
                "report_type": "account",
                "description": "Summary of all account balances by account type.",
                "default_parameters": {"group_by": "account_type"},
            },
            {
                "name": "New Accounts Report",
                "report_type": "account",
                "description": "List of all new accounts opened during the reporting period.",
                "default_parameters": {"date_range": "month"},
            },
            {
                "name": "Fraud Alert Summary",
                "report_type": "fraud",
                "description": "Summary of all fraud alerts with resolution status.",
                "default_parameters": {"include_resolved": True, "severity_filter": "all"},
            },
            {
                "name": "Monthly Compliance Report",
                "report_type": "compliance",
                "description": "Regulatory compliance report including KYC and AML metrics.",
                "default_parameters": {"date_range": "month", "include_exceptions": True},
            },
            {
                "name": "Profit & Loss Statement",
                "report_type": "financial",
                "description": "Financial income and expense statement.",
                "default_parameters": {"date_range": "month", "compare_previous": True},
            },
            {
                "name": "Cash Drawer Audit Report",
                "report_type": "audit",
                "description": "Audit trail of all cash drawer operations including variances.",
                "default_parameters": {"include_variances_only": False},
            },
            {
                "name": "System Performance Report",
                "report_type": "performance",
                "description": "Technical performance metrics including response times and error rates.",
                "default_parameters": {"time_range": "24h", "include_charts": True},
            },
        ]

        created_count = 0
        for template_data in templates:
            template, created = ReportTemplate.objects.get_or_create(name=template_data["name"], defaults=template_data)
            if created:
                created_count += 1

        self.stdout.write(
            f"  Created {created_count} report templates (skipped {len(templates) - created_count} existing)"
        )

    def seed_promotions(self):
        from core.models import Product, Promotion

        today = timezone.now().date()

        promotions = [
            {
                "name": "New Year Savings Bonus",
                "description": "Open a new savings account and get a ₵50 bonus when you maintain a balance of ₵500 for 30 days.",
                "bonus_amount": Decimal("50.00"),
                "start_date": today,
                "end_date": today + datetime.timedelta(days=90),
                "terms_and_conditions": "Bonus credited after 30 days of maintaining minimum balance. One bonus per customer.",
            },
            {
                "name": "Refer-a-Friend Reward",
                "description": "Refer a friend and earn ₵25 when they open an account and make their first deposit.",
                "bonus_amount": Decimal("25.00"),
                "start_date": today,
                "end_date": today + datetime.timedelta(days=180),
                "terms_and_conditions": "Referred friend must be a new customer. No limit on referrals.",
            },
            {
                "name": "Loan Interest Discount",
                "description": "Get 2% off our standard loan interest rate when you apply before month end.",
                "discount_percentage": Decimal("2.00"),
                "start_date": today,
                "end_date": today + datetime.timedelta(days=30),
                "terms_and_conditions": "Subject to credit approval. Discount applied to approved loan rate.",
            },
        ]

        created_count = 0
        for promo_data in promotions:
            promo, created = Promotion.objects.get_or_create(name=promo_data["name"], defaults=promo_data)
            if created:
                created_count += 1
                # Link to relevant products
                if "Savings" in promo.name:
                    savings_products = Product.objects.filter(product_type__in=["savings", "susu"])
                    promo.eligible_products.set(savings_products)
                elif "Loan" in promo.name:
                    loan_products = Product.objects.filter(product_type="loan")
                    promo.eligible_products.set(loan_products)

        self.stdout.write(f"  Created {created_count} promotions (skipped {len(promotions) - created_count} existing)")
