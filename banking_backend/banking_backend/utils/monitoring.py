"""
Comprehensive monitoring and logging system for the banking backend.
Tracks critical operations, performance metrics, and security events.
"""

import logging
import time
import functools
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from typing import Dict, Any

try:
    import psutil
    PSUTIL_AVAILABLE = True
except ImportError:
    PSUTIL_AVAILABLE = False

logger = logging.getLogger(__name__)


class BankingMonitoringService:
    """
    Service for monitoring banking operations and tracking metrics.
    """
    
    def __init__(self):
        self.performance_logs = []
        self.security_events = []
        self.transaction_metrics = {}
        
    def log_transaction_performance(self, transaction_id: str, operation: str, 
                                  duration_ms: float, success: bool,
                                  user_id: str = None, details: Dict[str, Any] = None):
        """Log transaction performance metrics."""
        metric = {
            'timestamp': timezone.now().isoformat(),
            'transaction_id': transaction_id,
            'operation': operation,
            'duration_ms': duration_ms,
            'success': success,
            'user_id': user_id,
            'details': details or {}
        }
        
        self.performance_logs.append(metric)
        
        # Log to main logger
        level = logging.INFO if success else logging.ERROR
        logger.log(level, f"Transaction {operation} completed", extra={
            'transaction_id': transaction_id,
            'duration_ms': duration_ms,
            'success': success,
            'user_id': user_id
        })
        
        # Keep only last 1000 performance logs in memory
        if len(self.performance_logs) > 1000:
            self.performance_logs = self.performance_logs[-1000:]
    
    def log_security_event(self, event_type: str, severity: str, 
                          user_id: str = None, ip_address: str = None,
                          description: str = None, details: Dict[str, Any] = None):
        """Log security-related events."""
        event = {
            'timestamp': timezone.now().isoformat(),
            'event_type': event_type,
            'severity': severity,  # 'low', 'medium', 'high', 'critical'
            'user_id': user_id,
            'ip_address': ip_address,
            'description': description,
            'details': details or {}
        }
        
        self.security_events.append(event)
        
        # Log to security logger
        if severity == 'critical':
            logger.critical(f"SECURITY: {event_type} - {description}", extra=event)
        elif severity == 'high':
            logger.error(f"SECURITY: {event_type} - {description}", extra=event)
        else:
            logger.warning(f"SECURITY: {event_type} - {description}", extra=event)
        
        # Keep only last 500 security events in memory
        if len(self.security_events) > 500:
            self.security_events = self.security_events[-500:]
    
    def track_transaction_metrics(self, transaction_type: str, amount: Decimal,
                                user_id: str, success: bool):
        """Track transaction-specific metrics."""
        if transaction_type not in self.transaction_metrics:
            self.transaction_metrics[transaction_type] = {
                'total_count': 0,
                'successful_count': 0,
                'failed_count': 0,
                'total_amount': Decimal('0.00'),
                'successful_amount': Decimal('0.00'),
                'failed_amount': Decimal('0.00'),
                'daily_counts': {},
                'hourly_counts': {}
            }
        
        metrics = self.transaction_metrics[transaction_type]
        metrics['total_count'] += 1
        
        if success:
            metrics['successful_count'] += 1
            metrics['successful_amount'] += abs(amount)
        else:
            metrics['failed_count'] += 1
            metrics['failed_amount'] += abs(amount)
        
        metrics['total_amount'] += abs(amount)
        
        # Track daily and hourly counts
        now = timezone.now()
        date_key = now.date().isoformat()
        hour_key = now.strftime('%Y-%m-%d %H:00')
        
        if date_key not in metrics['daily_counts']:
            metrics['daily_counts'][date_key] = 0
        metrics['daily_counts'][date_key] += 1
        
        if hour_key not in metrics['hourly_counts']:
            metrics['hourly_counts'][hour_key] = 0
        metrics['hourly_counts'][hour_key] += 1
    
    def get_performance_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get performance summary for specified time period."""
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        recent_logs = [
            log for log in self.performance_logs 
            if log['timestamp'] >= cutoff_time.isoformat()
        ]
        
        if not recent_logs:
            return {'error': 'No performance data available for specified period'}
        
        # Calculate statistics
        successful_ops = [log for log in recent_logs if log['success']]
        failed_ops = [log for log in recent_logs if not log['success']]
        
        avg_duration = sum(log['duration_ms'] for log in recent_logs) / len(recent_logs)
        success_rate = len(successful_ops) / len(recent_logs) * 100
        
        # Group by operation type
        by_operation = {}
        for log in recent_logs:
            op = log['operation']
            if op not in by_operation:
                by_operation[op] = {'count': 0, 'total_duration': 0, 'successes': 0}
            by_operation[op]['count'] += 1
            by_operation[op]['total_duration'] += log['duration_ms']
            if log['success']:
                by_operation[op]['successes'] += 1
        
        # Calculate averages
        for op in by_operation:
            op_data = by_operation[op]
            op_data['avg_duration'] = op_data['total_duration'] / op_data['count']
            op_data['success_rate'] = op_data['successes'] / op_data['count'] * 100
        
        return {
            'period_hours': hours,
            'total_operations': len(recent_logs),
            'successful_operations': len(successful_ops),
            'failed_operations': len(failed_ops),
            'success_rate_percent': round(success_rate, 2),
            'average_duration_ms': round(avg_duration, 2),
            'by_operation': by_operation,
            'slowest_operations': sorted(
                [(log['operation'], log['duration_ms']) for log in recent_logs],
                key=lambda x: x[1], reverse=True
            )[:10]
        }
    
    def get_security_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get security events summary for specified time period."""
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        recent_events = [
            event for event in self.security_events
            if event['timestamp'] >= cutoff_time.isoformat()
        ]
        
        if not recent_events:
            return {'message': 'No security events in specified period'}
        
        # Group by event type and severity
        by_type = {}
        by_severity = {}
        
        for event in recent_events:
            # By type
            event_type = event['event_type']
            if event_type not in by_type:
                by_type[event_type] = 0
            by_type[event_type] += 1
            
            # By severity
            severity = event['severity']
            if severity not in by_severity:
                by_severity[severity] = 0
            by_severity[severity] += 1
        
        return {
            'period_hours': hours,
            'total_events': len(recent_events),
            'by_event_type': by_type,
            'by_severity': by_severity,
            'critical_events': len([e for e in recent_events if e['severity'] == 'critical']),
            'high_events': len([e for e in recent_events if e['severity'] == 'high']),
            'recent_events': recent_events[-10:]  # Last 10 events
        }
    
    def get_transaction_summary(self, hours: int = 24) -> Dict[str, Any]:
        """Get transaction metrics summary."""
        cutoff_time = timezone.now() - timedelta(hours=hours)
        
        summary = {
            'period_hours': hours,
            'total_transactions': 0,
            'successful_transactions': 0,
            'failed_transactions': 0,
            'total_amount': Decimal('0.00'),
            'successful_amount': Decimal('0.00'),
            'by_type': {}
        }
        
        for trans_type, metrics in self.transaction_metrics.items():
            # Filter for time period (simplified - in production, store timestamps)
            type_summary = {
                'total_count': metrics['total_count'],
                'successful_count': metrics['successful_count'],
                'failed_count': metrics['failed_count'],
                'total_amount': metrics['total_amount'],
                'successful_amount': metrics['successful_amount'],
                'failed_amount': metrics['failed_amount']
            }
            
            if metrics['total_count'] > 0:
                type_summary['success_rate'] = (
                    metrics['successful_count'] / metrics['total_count'] * 100
                )
                type_summary['average_amount'] = (
                    metrics['total_amount'] / metrics['total_count']
                )
            
            summary['by_type'][trans_type] = type_summary
            summary['total_transactions'] += metrics['total_count']
            summary['successful_transactions'] += metrics['successful_count']
            summary['failed_transactions'] += metrics['failed_count']
            summary['total_amount'] += metrics['total_amount']
            summary['successful_amount'] += metrics['successful_amount']
        
        # Calculate overall success rate
        if summary['total_transactions'] > 0:
            summary['success_rate'] = (
                summary['successful_transactions'] / summary['total_transactions'] * 100
            )
            summary['average_amount'] = (
                summary['total_amount'] / summary['total_transactions']
            )
        
        return summary

    @staticmethod
    def get_system_metrics():
        """Get basic system metrics."""
        if not PSUTIL_AVAILABLE:
            return {
                "cpu_usage": 0.0,
                "memory_usage": 0.0,
                "disk_usage": 0.0,
                "error": "psutil not available"
            }

        try:
            # Try to get disk usage - handle different OS path formats
            try:
                disk_usage = psutil.disk_usage('/').percent
            except:
                # On Windows, try C: drive
                try:
                    disk_usage = psutil.disk_usage('C:\\').percent
                except:
                    disk_usage = 0.0

            return {
                "cpu_usage": psutil.cpu_percent(),
                "memory_usage": psutil.virtual_memory().percent,
                "disk_usage": disk_usage,
            }
        except Exception as e:
            return {
                "cpu_usage": 0.0,
                "memory_usage": 0.0,
                "disk_usage": 0.0,
                "error": f"Failed to get system metrics: {str(e)}"
            }


# Global monitoring service instance
monitoring_service = BankingMonitoringService()


# Alias classes for backward compatibility
PerformanceMonitor = BankingMonitoringService
TransactionMonitor = BankingMonitoringService
SystemHealthMonitor = BankingMonitoringService


def log_performance_metric(operation: str, duration_ms: float, success: bool,
                          user_id: str = None, transaction_id: str = None,
                          details: Dict[str, Any] = None):
    """
    Convenience function to log performance metrics.

    Args:
        operation: Name of the operation
        duration_ms: Duration in milliseconds
        success: Whether operation was successful
        user_id: User ID
        transaction_id: Transaction ID
        details: Additional details
    """
    monitoring_service.log_transaction_performance(
        transaction_id=transaction_id or 'unknown',
        operation=operation,
        duration_ms=duration_ms,
        success=success,
        user_id=user_id,
        details=details
    )


def monitor_operation(operation_name: str = None, log_success: bool = True):
    """
    Decorator to monitor operation performance and log events.
    
    Args:
        operation_name: Name for the operation (defaults to function name)
        log_success: Whether to log successful operations
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            operation = operation_name or func.__name__
            
            try:
                result = func(*args, **kwargs)
                duration_ms = (time.time() - start_time) * 1000
                
                if log_success:
                    # Try to extract transaction info from context
                    transaction_id = kwargs.get('transaction_id') or 'unknown'
                    user_id = kwargs.get('user_id') or 'unknown'
                    
                    monitoring_service.log_transaction_performance(
                        transaction_id=transaction_id,
                        operation=operation,
                        duration_ms=duration_ms,
                        success=True,
                        user_id=user_id
                    )
                
                return result
                
            except Exception as e:
                duration_ms = (time.time() - start_time) * 1000
                
                # Log failed operation
                transaction_id = kwargs.get('transaction_id') or 'unknown'
                user_id = kwargs.get('user_id') or 'unknown'
                
                monitoring_service.log_transaction_performance(
                    transaction_id=transaction_id,
                    operation=operation,
                    duration_ms=duration_ms,
                    success=False,
                    user_id=user_id,
                    details={'error': str(e), 'error_type': type(e).__name__}
                )
                
                # Log security event for failed operations
                monitoring_service.log_security_event(
                    event_type='operation_failure',
                    severity='medium',
                    user_id=user_id,
                    description=f"Operation {operation} failed: {str(e)}",
                    details={'operation': operation, 'error': str(e)}
                )
                
                raise
        
        return wrapper
    return decorator


def log_security_event(event_type: str, severity: str = 'low',
                      user_id: str = None, ip_address: str = None,
                      description: str = None, **kwargs):
    """
    Convenience function to log security events.
    
    Args:
        event_type: Type of security event
        severity: Severity level ('low', 'medium', 'high', 'critical')
        user_id: User ID associated with the event
        ip_address: IP address where event occurred
        description: Human-readable description
        **kwargs: Additional details to include
    """
    monitoring_service.log_security_event(
        event_type=event_type,
        severity=severity,
        user_id=user_id,
        ip_address=ip_address,
        description=description,
        details=kwargs
    )


def track_transaction(transaction_type: str, amount: Decimal,
                     user_id: str, success: bool = True):
    """
    Convenience function to track transaction metrics.
    
    Args:
        transaction_type: Type of transaction ('deposit', 'withdrawal', etc.)
        amount: Transaction amount
        user_id: User who performed the transaction
        success: Whether transaction was successful
    """
    monitoring_service.track_transaction_metrics(
        transaction_type=transaction_type,
        amount=amount,
        user_id=user_id,
        success=success
    )


# Django management command to view monitoring data
def get_monitoring_dashboard_data() -> Dict[str, Any]:
    """Get comprehensive monitoring data for dashboard."""
    return {
        'performance': monitoring_service.get_performance_summary(),
        'security': monitoring_service.get_security_summary(),
        'transactions': monitoring_service.get_transaction_summary(),
        'timestamp': timezone.now().isoformat()
    }