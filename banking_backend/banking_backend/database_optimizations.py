"""
Database optimization strategies for the banking backend.
Includes proper indexing, query optimization, and performance improvements.
"""

from django.db.models import Q


class DatabaseOptimizations:
    """
    Contains database optimization recommendations and migration commands.
    """
    
    # Recommended indexes for better query performance
    INDEX_RECOMMENDATIONS = [
        # Transaction table optimizations
        {
            'table': 'banking_transaction',
            'indexes': [
                ('idx_transaction_account_timestamp', ['account_id', '-timestamp']),
                ('idx_transaction_type_timestamp', ['type', '-timestamp']),
                ('idx_transaction_cashier_timestamp', ['cashier_id', '-timestamp']),
                ('idx_transaction_amount', ['amount']),
                ('idx_transaction_timestamp', ['-timestamp']),
            ]
        },
        
        # Account table optimizations
        {
            'table': 'banking_account',
            'indexes': [
                ('idx_account_owner', ['owner_id']),
                ('idx_account_type_status', ['type', 'status']),
                ('idx_account_balance', ['balance']),
                ('idx_account_number', ['account_number']),
            ]
        },
        
        # User table optimizations
        {
            'table': 'users_user',
            'indexes': [
                ('idx_user_role', ['role']),
                ('idx_user_email', ['email']),
                ('idx_user_is_active', ['is_active']),
                ('idx_user_role_active', ['role', 'is_active']),
            ]
        },
        
        # Loan and loan application optimizations
        {
            'table': 'banking_loan',
            'indexes': [
                ('idx_loan_account', ['account_id']),
                ('idx_loan_status', ['status']),
                ('idx_loan_outstanding_balance', ['outstanding_balance']),
                ('idx_loan_application_applicant', ['application_id', 'applicant_id']),
            ]
        },
        
        {
            'table': 'banking_loanapplication',
            'indexes': [
                ('idx_loan_app_applicant', ['applicant_id']),
                ('idx_loan_app_status', ['status']),
                ('idx_loan_app_submitted_at', ['-submitted_at']),
                ('idx_loan_app_applicant_status', ['applicant_id', 'status']),
            ]
        },
        
        # Operations table optimizations
        {
            'table': 'operations_clientkyc',
            'indexes': [
                ('idx_kyc_submitted_by', ['submitted_by_id']),
                ('idx_kyc_status', ['status']),
                ('idx_kyc_submitted_by_status', ['submitted_by_id', 'status']),
            ]
        },
        
        {
            'table': 'operations_commission',
            'indexes': [
                ('idx_commission_earned_by', ['earned_by_id']),
                ('idx_commission_type', ['commission_type']),
                ('idx_commission_created_at', ['-created_at']),
                ('idx_commission_earned_by_type', ['earned_by_id', 'commission_type']),
            ]
        }
    ]
    
    # Query optimization strategies
    QUERY_OPTIMIZATIONS = [
        {
            'description': 'Use select_related for foreign key relationships',
            'pattern': 'Model.objects.filter(...).select_related("foreign_key")',
            'benefit': 'Reduces database queries from O(n) to O(1) for related data'
        },
        {
            'description': 'Use prefetch_related for many-to-many relationships',
            'pattern': 'Model.objects.filter(...).prefetch_related("many_to_many")',
            'benefit': 'Reduces database queries for many-to-many relationships'
        },
        {
            'description': 'Use only() for specific field selection',
            'pattern': 'Model.objects.filter(...).only("field1", "field2")',
            'benefit': 'Reduces memory usage and query execution time'
        },
        {
            'description': 'Use defer() to exclude large fields',
            'pattern': 'Model.objects.filter(...).defer("large_field")',
            'benefit': 'Improves performance when large fields are not needed'
        },
        {
            'description': 'Use bulk operations for batch processing',
            'pattern': 'Model.objects.bulk_create([...]) or bulk_update([...])',
            'benefit': 'Reduces database round trips for batch operations'
        }
    ]


def create_performance_indexes():
    """
    Generate Django migration for performance indexes.
    Run this to add recommended indexes to the database.
    """
    migration_code = """
from django.db import migrations, models
from django.db.models import Index

class Migration(migrations.Migration):

    dependencies = [
        ('banking', '0001_initial'),
        ('users', '0001_initial'),
        ('operations', '0001_initial'),
    ]

    operations = [
        # Transaction indexes
        migrations.AddIndex(
            model_name='transaction',
            index=Index(fields=['account', '-timestamp'], name='idx_transaction_account_timestamp'),
        ),
        migrations.AddIndex(
            model_name='transaction',
            index=Index(fields=['type', '-timestamp'], name='idx_transaction_type_timestamp'),
        ),
        migrations.AddIndex(
            model_name='transaction',
            index=Index(fields=['cashier', '-timestamp'], name='idx_transaction_cashier_timestamp'),
        ),
        migrations.AddIndex(
            model_name='transaction',
            index=Index(fields=['amount'], name='idx_transaction_amount'),
        ),
        
        # Account indexes
        migrations.AddIndex(
            model_name='account',
            index=Index(fields=['owner'], name='idx_account_owner'),
        ),
        migrations.AddIndex(
            model_name='account',
            index=Index(fields=['type', 'status'], name='idx_account_type_status'),
        ),
        
        # User indexes
        migrations.AddIndex(
            model_name='user',
            index=Index(fields=['role'], name='idx_user_role'),
        ),
        migrations.AddIndex(
            model_name='user',
            index=Index(fields=['role', 'is_active'], name='idx_user_role_active'),
        ),
        
        # Loan indexes
        migrations.AddIndex(
            model_name='loan',
            index=Index(fields=['account'], name='idx_loan_account'),
        ),
        migrations.AddIndex(
            model_name='loan',
            index=Index(fields=['status'], name='idx_loan_status'),
        ),
        
        # Loan application indexes
        migrations.AddIndex(
            model_name='loanapplication',
            index=Index(fields=['applicant'], name='idx_loan_app_applicant'),
        ),
        migrations.AddIndex(
            model_name='loanapplication',
            index=Index(fields=['status'], name='idx_loan_app_status'),
        ),
        migrations.AddIndex(
            model_name='loanapplication',
            index=Index(fields=['-submitted_at'], name='idx_loan_app_submitted_at'),
        ),
        
        # KYC indexes
        migrations.AddIndex(
            model_name='clientkyc',
            index=Index(fields=['submitted_by'], name='idx_kyc_submitted_by'),
        ),
        migrations.AddIndex(
            model_name='clientkyc',
            index=Index(fields=['status'], name='idx_kyc_status'),
        ),
        
        # Commission indexes
        migrations.AddIndex(
            model_name='commission',
            index=Index(fields=['earned_by'], name='idx_commission_earned_by'),
        ),
        migrations.AddIndex(
            model_name='commission',
            index=Index(fields=['commission_type'], name='idx_commission_type'),
        ),
    ]
"""
    return migration_code


class QueryOptimizer:
    """
    Helper class with optimized query patterns for common operations.
    """
    
    @staticmethod
    def get_user_transactions_optimized(user_id: str, limit: int = 50):
        """
        Optimized query to get user transactions with related data.
        Uses select_related to avoid N+1 query problems.
        """
        from banking_backend.banking.models import Transaction
        
        return Transaction.objects.filter(
            account__owner_id=user_id
        ).select_related(
            'account',
            'cashier'
        ).prefetch_related(
            'account__owner'
        ).order_by('-timestamp')[:limit]
    
    @staticmethod
    def get_account_balance_history_optimized(account_id: str, days: int = 30):
        """
        Optimized query to get account balance history.
        Uses database aggregation to improve performance.
        """
        from django.db.models import Sum, Count, Avg
        from django.utils import timezone
        from datetime import timedelta
        
        from banking_backend.banking.models import Transaction
        
        end_date = timezone.now()
        start_date = end_date - timedelta(days=days)
        
        # Get daily transaction summaries
        return Transaction.objects.filter(
            account_id=account_id,
            timestamp__gte=start_date
        ).extra(
            select={'day': 'date(timestamp)'}
        ).values('day').annotate(
            total_deposits=Sum('amount', filter=Q(amount__gt=0)),
            total_withdrawals=Sum('amount', filter=Q(amount__lt=0)),
            transaction_count=Count('id'),
            avg_amount=Avg('amount')
        ).order_by('day')
    
    @staticmethod
    def get_daily_transaction_summary():
        """
        Optimized query for daily transaction summaries.
        Uses database aggregation for better performance.
        """
        from django.db.models import Sum, Count
        from django.utils import timezone
        
        from banking_backend.banking.models import Transaction
        
        today = timezone.now().date()
        
        return Transaction.objects.filter(
            timestamp__date=today
        ).aggregate(
            total_deposits=Sum('amount', filter=Q(amount__gt=0)),
            total_withdrawals=Sum('amount', filter=Q(amount__lt=0)),
            transaction_count=Count('id'),
            unique_accounts=Count('account', distinct=True),
            unique_cashiers=Count('cashier', distinct=True, filter=Q(cashier__isnull=False))
        )
    
    @staticmethod
    def get_performance_optimized_user_list(role: str = None, active_only: bool = True):
        """
        Optimized query to get users with pagination support.
        Uses only() to select specific fields.
        """
        from users.models import User
        
        queryset = User.objects.all()
        
        if role:
            queryset = queryset.filter(role=role)
        
        if active_only:
            queryset = queryset.filter(is_active=True)
        
        return queryset.only(
            'id', 'email', 'first_name', 'last_name', 'role', 'is_active'
        ).order_by('email')
    
    @staticmethod
    def bulk_create_transactions(transaction_data: list):
        """
        Optimized bulk creation of transactions.
        Uses Django's bulk_create for better performance.
        """
        from banking_backend.banking.models import Transaction
        
        transactions = []
        for data in transaction_data:
            transactions.append(Transaction(**data))
        
        return Transaction.objects.bulk_create(transactions)
    
    @staticmethod
    def get_active_loans_summary():
        """
        Optimized query to get active loans summary.
        Uses database aggregation and filtering.
        """
        from django.db.models import Sum, Count
        from banking_backend.banking.models import Loan
        
        return Loan.objects.filter(
            status='active'
        ).aggregate(
            total_outstanding=Sum('outstanding_balance'),
            total_principal=Sum('principal_amount'),
            loan_count=Count('id'),
            avg_outstanding=Sum('outstanding_balance') / Count('id')
        )


# Database connection optimization settings
DATABASE_OPTIMIZATION_SETTINGS = {
    'CONN_MAX_AGE': 600,  # Keep connections alive for 10 minutes
    'OPTIONS': {
        'charset': 'utf8mb4',
        'use_unicode': True,
    },
    'ENGINE': 'django.db.backends.mysql',  # or postgresql, sqlite3
    'NAME': 'banking_db',
    'USER': 'banking_user',
    'PASSWORD': 'secure_password',
    'HOST': 'localhost',
    'PORT': '3306',
    
    # Additional MySQL optimizations
    'MYSQL_DSN': {
        'charset': 'utf8mb4',
        'collation': 'utf8mb4_unicode_ci',
    }
}

# Query performance monitoring
class QueryPerformanceMonitor:
    """
    Monitor and log slow queries for optimization.
    """
    
    @staticmethod
    def log_slow_query(query_description: str, execution_time: float, 
                      query_sql: str = None, threshold_ms: float = 1000):
        """Log queries that exceed performance threshold."""
        if execution_time > threshold_ms:
            import logging
            logger = logging.getLogger('query.performance')
            logger.warning(
                f"Slow query detected: {query_description}",
                extra={
                    'execution_time_ms': execution_time,
                    'query_sql': query_sql,
                    'threshold_ms': threshold_ms
                }
            )


def generate_database_migration():
    """
    Generate a Django migration file with performance indexes.
    Run this function to create the migration file.
    """
    
    # Create the migration file
    migration_content = create_performance_indexes()
    
    # Save to file (you would run this as a management command in practice)
    with open('0002_add_performance_indexes.py', 'w') as f:
        f.write(migration_content)
    
    print("Performance indexes migration file created: 0002_add_performance_indexes.py")
    print("Run 'python manage.py migrate' to apply the indexes")


if __name__ == '__main__':
    # Example usage
    print("Database Optimization Recommendations:")
    print("=" * 50)
    
    for optimization in DatabaseOptimizations.QUERY_OPTIMIZATIONS:
        print(f"\\n{optimization['description']}")
        print(f"Pattern: {optimization['pattern']}")
        print(f"Benefit: {optimization['benefit']}")
    
    print("\\n" + "=" * 50)
    print("Recommended Indexes:")
    for table_config in DatabaseOptimizations.INDEX_RECOMMENDATIONS:
        print(f"\\nTable: {table_config['table']}")
        for index_name, fields in table_config['indexes']:
            print(f"  - {index_name}: {fields}")
    
    print("\\n" + "=" * 50)
    print("To apply indexes, run:")
    print("python manage.py makemigrations banking_backend")
    print("python manage.py migrate")