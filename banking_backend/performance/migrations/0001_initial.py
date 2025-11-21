# Generated manually for performance monitoring models

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='PerformanceMetric',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('metric_type', models.CharField(choices=[('response_time', 'Response Time'), ('throughput', 'Throughput'), ('error_rate', 'Error Rate'), ('cpu_usage', 'CPU Usage'), ('memory_usage', 'Memory Usage'), ('disk_usage', 'Disk Usage'), ('network_io', 'Network I/O'), ('transaction_volume', 'Transaction Volume'), ('active_users', 'Active Users'), ('queue_length', 'Queue Length')], max_length=20)),
                ('metric_name', models.CharField(max_length=100)),
                ('value', models.DecimalField(decimal_places=4, max_digits=15)),
                ('unit', models.CharField(blank=True, max_length=20)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('service_name', models.CharField(blank=True, max_length=100)),
                ('endpoint', models.CharField(blank=True, max_length=200)),
                ('tags', models.JSONField(blank=True, default=dict)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('user', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.CreateModel(
            name='SystemHealth',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('component_name', models.CharField(max_length=100)),
                ('component_type', models.CharField(max_length=50)),
                ('status', models.CharField(choices=[('healthy', 'Healthy'), ('warning', 'Warning'), ('critical', 'Critical'), ('unknown', 'Unknown')], default='unknown', max_length=20)),
                ('status_message', models.TextField(blank=True)),
                ('last_check', models.DateTimeField(auto_now_add=True)),
                ('next_check', models.DateTimeField(blank=True, null=True)),
                ('response_time', models.DecimalField(blank=True, decimal_places=2, max_digits=10, null=True)),
                ('cpu_usage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('memory_usage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('disk_usage', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('active_connections', models.IntegerField(default=0)),
                ('alert_enabled', models.BooleanField(default=True)),
                ('alert_thresholds', models.JSONField(blank=True, default=dict)),
                ('alert_contacts', models.JSONField(blank=True, default=list)),
                ('incident_count', models.IntegerField(default=0)),
                ('last_incident', models.DateTimeField(blank=True, null=True)),
                ('downtime_minutes', models.IntegerField(default=0)),
                ('location', models.CharField(blank=True, max_length=100)),
                ('version', models.CharField(blank=True, max_length=50)),
                ('tags', models.JSONField(blank=True, default=dict)),
            ],
            options={
                'ordering': ['component_name'],
                'unique_together': {('component_name', 'component_type')},
            },
        ),
        migrations.CreateModel(
            name='DashboardWidget',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(max_length=100)),
                ('widget_type', models.CharField(choices=[('chart', 'Chart'), ('metric', 'Metric'), ('table', 'Table'), ('alert', 'Alert Panel'), ('status', 'Status Indicator')], max_length=20)),
                ('chart_type', models.CharField(blank=True, choices=[('line', 'Line Chart'), ('bar', 'Bar Chart'), ('area', 'Area Chart'), ('pie', 'Pie Chart'), ('gauge', 'Gauge Chart')], max_length=20, null=True)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField(blank=True)),
                ('position_x', models.IntegerField(default=0)),
                ('position_y', models.IntegerField(default=0)),
                ('width', models.IntegerField(default=4)),
                ('height', models.IntegerField(default=3)),
                ('data_source', models.CharField(max_length=100)),
                ('metric_types', models.JSONField(blank=True, default=list)),
                ('filters', models.JSONField(blank=True, default=dict)),
                ('time_range', models.CharField(default='1h', max_length=20)),
                ('refresh_interval', models.IntegerField(default=60)),
                ('show_legend', models.BooleanField(default=True)),
                ('show_grid', models.BooleanField(default=True)),
                ('colors', models.JSONField(blank=True, default=list)),
                ('is_public', models.BooleanField(default=False)),
                ('shared_with', models.JSONField(blank=True, default=list)),
                ('is_active', models.BooleanField(default=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['position_y', 'position_x'],
            },
        ),
        migrations.CreateModel(
            name='PerformanceAlert',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('alert_level', models.CharField(choices=[('info', 'Info'), ('warning', 'Warning'), ('error', 'Error'), ('critical', 'Critical')], default='warning', max_length=20)),
                ('status', models.CharField(choices=[('active', 'Active'), ('acknowledged', 'Acknowledged'), ('resolved', 'Resolved'), ('suppressed', 'Suppressed')], default='active', max_length=20)),
                ('threshold_value', models.DecimalField(blank=True, decimal_places=4, max_digits=15, null=True)),
                ('actual_value', models.DecimalField(blank=True, decimal_places=4, max_digits=15, null=True)),
                ('threshold_operator', models.CharField(default='>', max_length=10)),
                ('notified_users', models.JSONField(blank=True, default=list)),
                ('notification_channels', models.JSONField(blank=True, default=list)),
                ('escalation_policy', models.JSONField(blank=True, default=dict)),
                ('triggered_at', models.DateTimeField(auto_now_add=True)),
                ('acknowledged_at', models.DateTimeField(blank=True, null=True)),
                ('resolved_at', models.DateTimeField(blank=True, null=True)),
                ('tags', models.JSONField(blank=True, default=dict)),
                ('resolution_notes', models.TextField(blank=True)),
                ('acknowledged_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='acknowledged_alerts', to=settings.AUTH_USER_MODEL)),
                ('resolved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='resolved_alerts', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-triggered_at'],
            },
        ),
        migrations.CreateModel(
            name='PerformanceRecommendation',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('description', models.TextField()),
                ('recommendation_type', models.CharField(choices=[('optimization', 'Optimization'), ('scaling', 'Scaling'), ('maintenance', 'Maintenance'), ('configuration', 'Configuration'), ('architecture', 'Architecture')], max_length=20)),
                ('priority', models.CharField(choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('critical', 'Critical')], default='medium', max_length=20)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('in_progress', 'In Progress'), ('implemented', 'Implemented'), ('rejected', 'Rejected'), ('deferred', 'Deferred')], default='pending', max_length=20)),
                ('analysis_data', models.JSONField(blank=True, default=dict)),
                ('metrics_snapshot', models.JSONField(blank=True, default=dict)),
                ('estimated_impact', models.TextField(blank=True)),
                ('implementation_effort', models.CharField(default='medium', max_length=20)),
                ('cost_benefit_ratio', models.DecimalField(blank=True, decimal_places=2, max_digits=5, null=True)),
                ('implemented_at', models.DateTimeField(blank=True, null=True)),
                ('implementation_notes', models.TextField(blank=True)),
                ('tags', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('assigned_to', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_recommendations', to=settings.AUTH_USER_MODEL)),
                ('implemented_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='implemented_recommendations', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        # Add indexes
        migrations.AddIndex(
            model_name='performancemetric',
            index=models.Index(fields=['metric_type', '-timestamp'], name='performanc_metric_ty_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='performancemetric',
            index=models.Index(fields=['service_name', '-timestamp'], name='performanc_service__123456_idx'),
        ),
        migrations.AddIndex(
            model_name='performancemetric',
            index=models.Index(fields=['-timestamp'], name='performanc_timest_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='systemhealth',
            index=models.Index(fields=['status'], name='performanc_status_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='systemhealth',
            index=models.Index(fields=['component_type'], name='performanc_compone_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='systemhealth',
            index=models.Index(fields=['last_check'], name='performanc_last_ch_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='dashboardwidget',
            index=models.Index(fields=['created_by'], name='performanc_created_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='dashboardwidget',
            index=models.Index(fields=['is_active'], name='performanc_is_acti_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='dashboardwidget',
            index=models.Index(fields=['widget_type'], name='performanc_widget_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='performancealert',
            index=models.Index(fields=['status'], name='performanc_status_234567_idx'),
        ),
        migrations.AddIndex(
            model_name='performancealert',
            index=models.Index(fields=['alert_level'], name='performanc_alert_l_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='performancealert',
            index=models.Index(fields=['-triggered_at'], name='performanc_trigger_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='performancerecommendation',
            index=models.Index(fields=['status'], name='performanc_status_345678_idx'),
        ),
        migrations.AddIndex(
            model_name='performancerecommendation',
            index=models.Index(fields=['priority'], name='performanc_priorit_123456_idx'),
        ),
        migrations.AddIndex(
            model_name='performancerecommendation',
            index=models.Index(fields=['recommendation_type'], name='performanc_recomme_123456_idx'),
        ),
    ]