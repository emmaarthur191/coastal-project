"""
Cache utilities for performance optimization.
Provides caching for expensive database queries like dashboard stats.
"""
from django.core.cache import cache
from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


# Cache TTL constants
CACHE_TTL_SHORT = 60  # 1 minute
CACHE_TTL_MEDIUM = 300  # 5 minutes  
CACHE_TTL_LONG = 900  # 15 minutes
CACHE_TTL_HOUR = 3600  # 1 hour


def get_dashboard_stats():
    """
    Get cached dashboard statistics.
    Uses database aggregations instead of Python loops for efficiency.
    """
    cache_key = 'dashboard_stats_v1'
    stats = cache.get(cache_key)
    
    if stats is None:
        from users.models import User
        from banking.models import Account, Loan
        from transactions.models import Transaction as BankingTransaction
        from fraud_detection.models import FraudAlert
        
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        sixty_days_ago = now - timedelta(days=60)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        
        try:
            # User stats with efficient queries
            user_stats = User.objects.aggregate(
                total_users=Count('id'),
                active_users=Count('id', filter=models.Q(is_active=True)),
                recent_users=Count('id', filter=models.Q(date_joined__gte=thirty_days_ago)),
                previous_period_users=Count('id', filter=models.Q(
                    date_joined__gte=sixty_days_ago,
                    date_joined__lt=thirty_days_ago
                ))
            )
            
            # Account stats with database aggregation
            account_stats = Account.objects.aggregate(
                active_accounts=Count('id', filter=models.Q(is_active=True)),
                total_balance=Sum('balance'),
                avg_balance=Avg('balance')
            )
            
            # Loan stats
            loan_stats = Loan.objects.aggregate(
                active_loans=Count('id', filter=models.Q(status='active')),
                total_loan_amount=Sum('amount', filter=models.Q(status='active'))
            )
            
            # Transaction stats
            transaction_stats = BankingTransaction.objects.aggregate(
                today_count=Count('id', filter=models.Q(created_at__gte=today_start)),
                week_count=Count('id', filter=models.Q(created_at__gte=week_start)),
                today_volume=Sum('amount', filter=models.Q(created_at__gte=today_start)),
                week_volume=Sum('amount', filter=models.Q(created_at__gte=week_start))
            )
            
            # Security stats
            fraud_stats = FraudAlert.objects.aggregate(
                active_alerts=Count('id', filter=models.Q(status='active')),
                suspicious_today=Count('id', filter=models.Q(
                    status='active',
                    created_at__gte=today_start
                ))
            )
            
            stats = {
                'users': {
                    'total': user_stats['total_users'] or 0,
                    'active': user_stats['active_users'] or 0,
                    'recent': user_stats['recent_users'] or 0,
                    'previous_period': user_stats['previous_period_users'] or 0,
                },
                'accounts': {
                    'active': account_stats['active_accounts'] or 0,
                    'total_balance': float(account_stats['total_balance'] or 0),
                    'avg_balance': float(account_stats['avg_balance'] or 0),
                },
                'loans': {
                    'active': loan_stats['active_loans'] or 0,
                    'total_amount': float(loan_stats['total_loan_amount'] or 0),
                },
                'transactions': {
                    'today_count': transaction_stats['today_count'] or 0,
                    'week_count': transaction_stats['week_count'] or 0,
                    'today_volume': float(transaction_stats['today_volume'] or 0),
                    'week_volume': float(transaction_stats['week_volume'] or 0),
                },
                'security': {
                    'active_alerts': fraud_stats['active_alerts'] or 0,
                    'suspicious_today': fraud_stats['suspicious_today'] or 0,
                },
                'cached_at': now.isoformat(),
            }
            
            cache.set(cache_key, stats, CACHE_TTL_MEDIUM)
            logger.debug(f"Dashboard stats cached: {stats}")
            
        except Exception as e:
            logger.error(f"Error getting dashboard stats: {e}")
            stats = {
                'users': {'total': 0, 'active': 0, 'recent': 0, 'previous_period': 0},
                'accounts': {'active': 0, 'total_balance': 0, 'avg_balance': 0},
                'loans': {'active': 0, 'total_amount': 0},
                'transactions': {'today_count': 0, 'week_count': 0, 'today_volume': 0, 'week_volume': 0},
                'security': {'active_alerts': 0, 'suspicious_today': 0},
                'error': str(e),
            }
    
    return stats


def get_security_stats():
    """Get cached security statistics."""
    cache_key = 'security_stats_v1'
    stats = cache.get(cache_key)
    
    if stats is None:
        from users.models import LoginAttempt, AuditLog, SecurityEvent
        from fraud_detection.models import FraudRule, FraudCase
        
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        try:
            stats = {
                'failed_logins_today': LoginAttempt.objects.filter(
                    status='failure',
                    timestamp__gte=today_start
                ).count(),
                'suspicious_activities': AuditLog.objects.filter(
                    is_suspicious=True,
                    timestamp__gte=today_start
                ).count(),
                'blocked_ips': LoginAttempt.objects.filter(
                    status='blocked',
                    timestamp__gte=today_start
                ).values('ip_address').distinct().count(),
                'security_events': SecurityEvent.objects.filter(
                    timestamp__gte=today_start
                ).count(),
                'active_fraud_rules': FraudRule.objects.filter(is_active=True).count(),
                'open_fraud_cases': FraudCase.objects.filter(
                    status__in=['open', 'investigating']
                ).count(),
                'cached_at': now.isoformat(),
            }
            
            cache.set(cache_key, stats, CACHE_TTL_SHORT)
            
        except Exception as e:
            logger.error(f"Error getting security stats: {e}")
            stats = {'error': str(e)}
    
    return stats


def invalidate_dashboard_cache():
    """Invalidate all dashboard-related caches."""
    cache.delete_many([
        'dashboard_stats_v1',
        'security_stats_v1',
    ])


def get_user_list_optimized(role=None, limit=100):
    """
    Get optimized user list with select_related/prefetch_related.
    """
    from users.models import User
    
    queryset = User.objects.select_related('profile').prefetch_related(
        'accounts',
        'audit_logs'
    ).order_by('-date_joined')
    
    if role:
        queryset = queryset.filter(role=role)
    
    return queryset[:limit]


def get_member_list_optimized(limit=100):
    """Get optimized member (customer) list."""
    return get_user_list_optimized(role='customer', limit=limit)


def get_staff_list_optimized(limit=100):
    """Get optimized staff list (non-customers)."""
    from users.models import User
    
    return User.objects.exclude(
        role='customer'
    ).select_related(
        'profile'
    ).prefetch_related(
        'audit_logs'
    ).order_by('-date_joined')[:limit]
