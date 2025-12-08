#!/usr/bin/env python
import os
import django
import sys

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User
from banking.models import Account, Transaction, LoanApplication

def test_relationships():
    print("=== MODEL RELATIONSHIP VALIDATION ===")
    
    # Test User relationships
    user = User.objects.first()
    print(f"Sample User: {user.email if user else 'No users found'}")
    
    if user:
        print("\n--- User Relationships ---")
        print(f"Has 'accounts' relationship: {hasattr(user, 'accounts')}")
        print(f"Has 'loan_applications' relationship: {hasattr(user, 'loan_applications')}")
        print(f"Has 'profile' relationship: {hasattr(user, 'profile')}")
        
        # Test related field counts
        if hasattr(user, 'accounts'):
            print(f"User accounts count: {user.accounts.count()}")
        if hasattr(user, 'loan_applications'):
            print(f"User loan applications count: {user.loan_applications.count()}")
    
    # Test Account relationships
    account = Account.objects.first()
    print(f"\n--- Account Relationships ---")
    print(f"Sample Account: {account.id if account else 'No accounts found'}")
    
    if account:
        owner_email = account.owner.email if account.owner else 'No owner'
        print(f"Account owner relationship: {owner_email}")
        print(f"Has 'transactions' relationship: {hasattr(account, 'transactions')}")
        print(f"Has 'loans' relationship: {hasattr(account, 'loans')}")

        if hasattr(account, 'transactions'):
            print(f"Account transactions count: {account.transactions.count()}")
        if hasattr(account, 'loans'):
            print(f"Account loans count: {account.loans.count()}")
    
    # Test Transaction relationships
    transaction = Transaction.objects.first()
    print(f"\n--- Transaction Relationships ---")
    print(f"Sample Transaction: {transaction.id if transaction else 'No transactions found'}")
    
    if transaction:
        account_id = transaction.account.id if transaction.account else 'No account'
        print(f"Transaction account: {account_id}")
        print(f"Transaction has 'fees' relationship: {hasattr(transaction, 'fees')}")
    
    print("\n=== RELATIONSHIP TEST COMPLETE ===")

if __name__ == "__main__":
    test_relationships()