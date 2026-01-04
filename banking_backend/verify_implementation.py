import os
import random
import sys
from decimal import Decimal

import django

# Add current directory to sys.path
sys.path.append(os.getcwd())

# Setup Django environment
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "banking_backend.settings")
django.setup()

from core.models import Expense
from core.services import AccountService, TransactionService
from users.models import User


def verify_ids_and_expenses():
    print("--- Verifying ID Generation and Expenses ---")

    # 1. Verify Staff ID Generation
    print("\n1. Testing Staff ID Generation...")
    email_seq = random.randint(1000, 9999)
    try:
        staff_user = User.objects.create_user(
            username=f"newstaff{email_seq}",
            email=f"staff{email_seq}@test.com",
            password=os.environ.get("TEST_PASSWORD", "password123"),
            role="cashier",
        )
        print(f"Created Staff User: {staff_user.email}")
        print(f"Generated Staff ID: {staff_user.staff_id}")

        if staff_user.staff_id and staff_user.staff_id.startswith("CA-"):
            print("SUCCESS: Staff ID format looks correct.")
        else:
            print(f"FAILURE: Staff ID format incorrect: {staff_user.staff_id}")

    except Exception as e:
        print(f"FAILURE creating staff user: {e}")

    # 2. Verify Client Account Number Generation
    print("\n2. Testing Client Account Number Generation...")
    try:
        client_user = User.objects.create_user(
            username=f"client{email_seq}",
            email=f"client{email_seq}@test.com",
            password=os.environ.get("TEST_PASSWORD", "password123"),
            role="customer",
        )
        account = AccountService.create_account(client_user, "checking")
        print(f"Created Account: {account.account_number}")

        if account.account_number.startswith("2231") and len(account.account_number) == 13:
            print("SUCCESS: Account Number format is correct (Starts with 2231, length 13).")
        else:
            print(
                f"FAILURE: Account Number format incorrect: {account.account_number} (Len: {len(account.account_number)})"
            )

    except Exception as e:
        print(f"FAILURE creating client account: {e}")

    # 3. Verify Expense Automation
    print("\n3. Testing Expense Automation...")
    try:
        # Create a source account for payment (needs balance)
        source_account = AccountService.create_account(staff_user, "checking")  # Using staff user for simplicity
        source_account.balance = Decimal("5000.00")
        source_account.save()

        # Create a Payment Transaction
        print("Creating 'payment' transaction...")
        tx = TransactionService.create_transaction(
            from_account=source_account,
            to_account=None,
            amount=Decimal("150.00"),
            transaction_type="payment",
            description="Test Payment for Verification",
        )
        print(f"Transaction Created: ID {tx.id}, Type: {tx.transaction_type}, Status: {tx.status}")

        # Check for Expense
        expense = Expense.objects.filter(transaction=tx).first()
        if expense:
            print(f"SUCCESS: Expense created automatically: {expense}")
            print(
                f"Expense Details: Amount={expense.amount}, Category={expense.category}, Desc='{expense.description}'"
            )
        else:
            print("FAILURE: No Expense found for this payment transaction.")

    except Exception as e:
        print(f"FAILURE verification error: {e}")


if __name__ == "__main__":
    verify_ids_and_expenses()
