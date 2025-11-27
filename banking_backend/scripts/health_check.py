#!/usr/bin/env python3
"""
Health Check Script for Banking Backend
Comprehensive health monitoring for all system components.
"""

import os
import sys
import json
import time
import psutil
import requests
from datetime import datetime, timedelta
from pathlib import Path

# Add the project root to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.db import connections
from django.core.cache import cache
from django.conf import settings


class HealthChecker:
    """Comprehensive health checker for all system components."""

    def __init__(self):
        self.results = {}
        self.start_time = time.time()

    def run_all_checks(self):
        """Run all health checks."""
        self.results = {
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'healthy',
            'checks': {}
        }

        checks = [
            ('database', self.check_database),
            ('redis', self.check_redis),
            ('django', self.check_django),
            ('system', self.check_system_resources),
            ('disk_space', self.check_disk_space),
            ('network', self.check_network_connectivity),
            ('security', self.check_security_headers),
        ]

        for check_name, check_func in checks:
            try:
                self.results['checks'][check_name] = check_func()
            except Exception as e:
                self.results['checks'][check_name] = {
                    'status': 'error',
                    'message': str(e),
                    'response_time': 0
                }
                self.results['status'] = 'unhealthy'

        # Determine overall status
        if any(check.get('status') == 'error' for check in self.results['checks'].values()):
            self.results['status'] = 'unhealthy'
        elif any(check.get('status') == 'warning' for check in self.results['checks'].values()):
            self.results['status'] = 'warning'

        self.results['response_time'] = time.time() - self.start_time

        return self.results

    def check_database(self):
        """Check database connectivity and performance."""
        start_time = time.time()

        try:
            # Test database connection
            db_conn = connections['default']
            with db_conn.cursor() as cursor:
                cursor.execute("SELECT 1")
                result = cursor.fetchone()

            # Get database statistics
            with db_conn.cursor() as cursor:
                cursor.execute("""
                    SELECT
                        count(*) as active_connections
                    FROM pg_stat_activity
                    WHERE state = 'active'
                """)
                active_connections = cursor.fetchone()[0]

            response_time = time.time() - start_time

            return {
                'status': 'healthy',
                'response_time': round(response_time * 1000, 2),  # ms
                'active_connections': active_connections,
                'message': 'Database connection successful'
            }

        except Exception as e:
            return {
                'status': 'error',
                'response_time': time.time() - start_time,
                'message': f'Database check failed: {str(e)}'
            }

    def check_redis(self):
        """Check Redis connectivity and performance."""
        start_time = time.time()

        try:
            # Test Redis connection
            cache.set('health_check', 'ok', 10)
            result = cache.get('health_check')

            if result != 'ok':
                raise Exception("Redis set/get test failed")

            # Get Redis info
            redis_info = cache._cache.get_client().info()

            response_time = time.time() - start_time

            return {
                'status': 'healthy',
                'response_time': round(response_time * 1000, 2),
                'used_memory': redis_info.get('used_memory_human', 'unknown'),
                'connected_clients': redis_info.get('connected_clients', 0),
                'message': 'Redis connection successful'
            }

        except Exception as e:
            return {
                'status': 'error',
                'response_time': time.time() - start_time,
                'message': f'Redis check failed: {str(e)}'
            }

    def check_django(self):
        """Check Django application health."""
        start_time = time.time()

        try:
            # Test Django views (if running)
            health_url = getattr(settings, 'HEALTH_CHECK_URL', 'http://localhost:8000/health/')
            response = requests.get(health_url, timeout=5)

            response_time = time.time() - start_time

            if response.status_code == 200:
                return {
                    'status': 'healthy',
                    'response_time': round(response_time * 1000, 2),
                    'status_code': response.status_code,
                    'message': 'Django application responding'
                }
            else:
                return {
                    'status': 'warning',
                    'response_time': round(response_time * 1000, 2),
                    'status_code': response.status_code,
                    'message': f'Django returned status {response.status_code}'
                }

        except requests.exceptions.RequestException as e:
            return {
                'status': 'error',
                'response_time': time.time() - start_time,
                'message': f'Django health check failed: {str(e)}'
            }

    def check_system_resources(self):
        """Check system resource usage."""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)

            # Memory usage
            memory = psutil.virtual_memory()
            memory_percent = memory.percent

            # Determine status based on thresholds
            status = 'healthy'
            if cpu_percent > 90 or memory_percent > 90:
                status = 'error'
            elif cpu_percent > 80 or memory_percent > 80:
                status = 'warning'

            return {
                'status': status,
                'cpu_percent': cpu_percent,
                'memory_percent': memory_percent,
                'memory_used': memory.used,
                'memory_total': memory.total,
                'message': f'System resources: CPU {cpu_percent}%, Memory {memory_percent}%'
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'System resource check failed: {str(e)}'
            }

    def check_disk_space(self):
        """Check disk space availability."""
        try:
            disk_usage = psutil.disk_usage('/')

            # Check if disk space is below threshold
            free_percent = 100 - disk_usage.percent
            status = 'healthy'

            if free_percent < 5:
                status = 'error'
            elif free_percent < 10:
                status = 'warning'

            return {
                'status': status,
                'total_space': disk_usage.total,
                'used_space': disk_usage.used,
                'free_space': disk_usage.free,
                'free_percent': free_percent,
                'message': f'Disk space: {free_percent:.1f}% free'
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Disk space check failed: {str(e)}'
            }

    def check_network_connectivity(self):
        """Check network connectivity to external services."""
        start_time = time.time()

        try:
            # Test external connectivity (Google DNS)
            response = requests.get('https://8.8.8.8', timeout=5)

            response_time = time.time() - start_time

            return {
                'status': 'healthy',
                'response_time': round(response_time * 1000, 2),
                'message': 'Network connectivity OK'
            }

        except Exception as e:
            return {
                'status': 'warning',
                'response_time': time.time() - start_time,
                'message': f'Network connectivity issue: {str(e)}'
            }

    def check_security_headers(self):
        """Check security headers on the application."""
        try:
            base_url = getattr(settings, 'BASE_URL', 'http://localhost:8000')
            response = requests.get(base_url, timeout=5)

            headers = response.headers
            security_headers = {
                'X-Frame-Options': headers.get('X-Frame-Options'),
                'X-Content-Type-Options': headers.get('X-Content-Type-Options'),
                'X-XSS-Protection': headers.get('X-XSS-Protection'),
                'Strict-Transport-Security': headers.get('Strict-Transport-Security'),
                'Content-Security-Policy': headers.get('Content-Security-Policy'),
            }

            # Check for missing critical headers
            missing_headers = []
            for header, value in security_headers.items():
                if not value:
                    missing_headers.append(header)

            status = 'healthy' if not missing_headers else 'warning'

            return {
                'status': status,
                'security_headers': security_headers,
                'missing_headers': missing_headers,
                'message': f'Security headers check: {len(missing_headers)} missing'
            }

        except Exception as e:
            return {
                'status': 'error',
                'message': f'Security headers check failed: {str(e)}'
            }

    def to_json(self):
        """Return results as JSON string."""
        return json.dumps(self.results, indent=2, default=str)

    def to_dict(self):
        """Return results as dictionary."""
        return self.results


def main():
    """Main function for command-line usage."""
    import argparse

    parser = argparse.ArgumentParser(description='Health check for Banking Backend')
    parser.add_argument('--format', choices=['json', 'text'], default='text',
                       help='Output format')
    parser.add_argument('--quiet', action='store_true',
                       help='Only output status, no details')

    args = parser.parse_args()

    checker = HealthChecker()
    results = checker.run_all_checks()

    if args.quiet:
        print(results['status'])
        sys.exit(0 if results['status'] == 'healthy' else 1)

    if args.format == 'json':
        print(checker.to_json())
    else:
        print(f"Health Check Results - Status: {results['status']}")
        print(f"Timestamp: {results['timestamp']}")
        print(f"Response Time: {results['response_time']:.2f}s")
        print("\nDetailed Checks:")
        for check_name, check_result in results['checks'].items():
            status = check_result.get('status', 'unknown')
            message = check_result.get('message', 'No message')
            response_time = check_result.get('response_time', 0)
            print(f"  {check_name}: {status} ({response_time:.2f}ms) - {message}")

    # Exit with appropriate code
    sys.exit(0 if results['status'] == 'healthy' else 1)


if __name__ == '__main__':
    main()