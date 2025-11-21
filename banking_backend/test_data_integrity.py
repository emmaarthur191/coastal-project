#!/usr/bin/env python
import os
import django

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from users.models import User, UserProfile, OTPVerification
from banking.models import Account, Transaction, LoanApplication, Loan, LoanRepayment, Branch
from operations.models import Commission, Expense, VisitSchedule, Message

def test_data_integrity():
    print("=== DATABASE INTEGRITY TEST ===")
    
    # Test User model
    users = User.objects.all()
    print(f"\n--- User Model ---")
    print(f"Total Users: {users.count()}")
    
    # Check user profiles
    profiles = UserProfile.objects.all()
    print(f"Total Profiles: {profiles.count()}")
    
    # Check for orphaned profiles
    orphaned_profiles = profiles.filter(user__isnull=True)
    print(f"Orphaned Profiles: {orphaned_profiles.count()}")
    
    # Test Account model  
    accounts = Account.objects.all()
    print(f"\n--- Account Model ---")
    print(f"Total Accounts: {accounts.count()}")
    
    # Check for orphaned accounts
    orphaned_accounts = accounts.filter(owner__isnull=True)
    print(f"Orphaned Accounts: {orphaned_accounts.count()}")
    
    # Test Transaction model
    transactions = Transaction.objects.all()
    print(f"\n--- Transaction Model ---")
    print(f"Total Transactions: {transactions.count()}")
    
    # Check for orphaned transactions
    orphaned_transactions = transactions.filter(account__isnull=True)
    print(f"Orphaned Transactions: {orphaned_transactions.count()}")
    
    # Test Loan Application model
    loan_applications = LoanApplication.objects.all()
    print(f"\n--- Loan Application Model ---")
    print(f"Total Loan Applications: {loan_applications.count()}")
    
    # Check for orphaned loan applications
    orphaned_apps = loan_applications.filter(applicant__isnull=True)
    print(f"Orphaned Loan Applications: {orphaned_apps.count()}")
    
    # Test Loan model
    loans = Loan.objects.all()
    print(f"\n--- Loan Model ---")
    print(f"Total Loans: {loans.count()}")
    
    # Check for orphaned loans
    orphaned_loans = loans.filter(application__isnull=True).count()
    print(f"Orphaned Loans (Application): {orphaned_loans}")
    
    orphaned_loans_account = loans.filter(account__isnull=True).count()
    print(f"Orphaned Loans (Account): {orphaned_loans_account}")
    
    # Test Operations models
    try:
        commissions = Commission.objects.all()
        print(f"\n--- Operations Model ---")
        print(f"Total Commissions: {commissions.count()}")
        
        expenses = Expense.objects.all()
        print(f"Total Expenses: {expenses.count()}")
        
        visits = VisitSchedule.objects.all()
        print(f"Total Visit Schedules: {visits.count()}")
        
        messages = Message.objects.all()
        print(f"Total Messages: {messages.count()}")
    except Exception as e:
        print(f"Error accessing operations models: {e}")
    
    # Test data consistency
    print(f"\n--- Data Consistency Checks ---")
    
    # Check user roles
    roles = users.values_list('role', flat=True).distinct()
    print(f"User roles found: {list(roles)}")
    
    # Check account types
    account_types = accounts.values_list('type', flat=True).distinct()
    print(f"Account types found: {list(account_types)}")
    
    # Check transaction types
    transaction_types = transactions.values_list('type', flat=True).distinct()
    print(f"Transaction types found: {list(transaction_types)}")
    
    # Check loan statuses
    loan_statuses = loan_applications.values_list('status', flat=True).distinct()
    print(f"Loan application statuses: {list(loan_statuses)}")
    
    # Performance test - count queries
    print(f"\n--- Basic Performance Test ---")
    print("Testing basic query performance...")
    
    import time
    start_time = time.time()
    user_count = User.objects.count()
    end_time = time.time()
    print(f"User count query took: {end_time - start_time:.4f} seconds")
    
    start_time = time.time()
    accounts_count = Account.objects.count()
    end_time = time.time()
    print(f"Account count query took: {end_time - start_time:.4f} seconds")
    
    print("\n=== DATA INTEGRITY TEST COMPLETE ===")
    
    # Summary
    total_issues = (orphaned_profiles.count() + orphaned_accounts.count() + 
                   orphaned_transactions.count() + orphaned_apps.count() + 
                   orphaned_loans + orphaned_loans_account)
    
    if total_issues == 0:
        print("SUCCESS: NO DATA INTEGRITY ISSUES FOUND!")
    else:
        print(f"WARNING: FOUND {total_issues} DATA INTEGRITY ISSUES")
        
    return total_issues == 0

if __name__ == "__main__":
    test_data_integrity()