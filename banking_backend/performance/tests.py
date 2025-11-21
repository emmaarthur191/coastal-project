from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from .models import PerformanceMetric, SystemHealth, DashboardWidget, PerformanceAlert, PerformanceRecommendation

User = get_user_model()


class PerformanceMetricModelTestCase(TestCase):
    """Test cases for PerformanceMetric model."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='test@example.com',
            password='testpass123',
            role='cashier'
        )

    def test_performance_metric_creation(self):
        """Test creating a performance metric."""
        metric = PerformanceMetric.objects.create(
            metric_type='response_time',
            metric_name='API Response Time',
            value=150.5,
            unit='ms',
            service_name='api',
            user=self.user
        )
        self.assertEqual(metric.metric_type, 'response_time')
        self.assertEqual(metric.value, 150.5)
        self.assertEqual(metric.unit, 'ms')


class SystemHealthModelTestCase(TestCase):
    """Test cases for SystemHealth model."""

    def test_system_health_creation(self):
        """Test creating a system health record."""
        health = SystemHealth.objects.create(
            component_name='database',
            component_type='database',
            status='healthy',
            cpu_usage=45.2,
            memory_usage=67.8
        )
        self.assertEqual(health.component_name, 'database')
        self.assertEqual(health.status, 'healthy')
        self.assertTrue(health.is_healthy())

    def test_health_alert_logic(self):
        """Test health alert threshold logic."""
        health = SystemHealth.objects.create(
            component_name='web_server',
            component_type='web_server',
            status='warning',
            cpu_usage=85.0,
            alert_thresholds={'cpu': 80, 'memory': 85}
        )
        self.assertTrue(health.needs_alert())


class PerformanceMetricAPITestCase(APITestCase):
    """Test cases for PerformanceMetric API."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='api@example.com',
            password='testpass123',
            role='cashier'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_metrics(self):
        """Test retrieving performance metrics."""
        PerformanceMetric.objects.create(
            metric_type='response_time',
            metric_name='API Response Time',
            value=120.0,
            unit='ms',
            service_name='api'
        )

        response = self.client.get('/api/performance/metrics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_create_metric(self):
        """Test creating a performance metric via API."""
        data = {
            'metric_type': 'throughput',
            'metric_name': 'API Throughput',
            'value': 1000,
            'unit': 'requests/sec',
            'service_name': 'api'
        }

        response = self.client.post('/api/performance/metrics/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(PerformanceMetric.objects.count(), 1)


class SystemHealthAPITestCase(APITestCase):
    """Test cases for SystemHealth API."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='health@example.com',
            password='testpass123',
            role='operations_manager'
        )
        self.client.force_authenticate(user=self.user)

    def test_get_system_health(self):
        """Test retrieving system health data."""
        SystemHealth.objects.create(
            component_name='database',
            component_type='database',
            status='healthy'
        )

        response = self.client.get('/api/performance/system-health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_health_summary(self):
        """Test system health summary endpoint."""
        SystemHealth.objects.create(
            component_name='database',
            component_type='database',
            status='healthy'
        )
        SystemHealth.objects.create(
            component_name='web_server',
            component_type='web_server',
            status='warning'
        )

        response = self.client.get('/api/performance/system-health/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_components'], 2)
        self.assertEqual(response.data['healthy_components'], 1)
        self.assertEqual(response.data['warning_components'], 1)


class DashboardWidgetAPITestCase(APITestCase):
    """Test cases for DashboardWidget API."""

    def setUp(self):
        self.user = User.objects.create_user(
            email='widget@example.com',
            password='testpass123',
            role='manager'
        )
        self.client.force_authenticate(user=self.user)

    def test_create_widget(self):
        """Test creating a dashboard widget."""
        data = {
            'name': 'Total Revenue',
            'widget_type': 'metric',           # changed from "line_chart"
            'config': {"metric": "total_revenue"},
            'visibility': 'global',
            'title': 'Total Revenue Metric',
            'data_source': 'performance_metrics',
            'position_x': 0,
            'position_y': 0,
            'width': 6,
            'height': 4,
            'created_by': self.user.id  # Add this line
        }

        response = self.client.post('/api/performance/dashboard-widgets/', data)
        print(response.status_code)
        print(response.data)  # ← add this
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(DashboardWidget.objects.count(), 1)

    def test_widget_permissions(self):
        """Test widget visibility permissions."""
        # Create widget by another user
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            role='cashier'
        )

        widget = DashboardWidget.objects.create(
            name='Private Widget',
            widget_type='metric',
            title='Private Metric',
            created_by=other_user,
            is_public=False
        )

        # Should not be visible to current user
        response = self.client.get('/api/performance/dashboard-widgets/')
        self.assertEqual(len(response.data), 0)