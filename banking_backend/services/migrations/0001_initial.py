# Generated manually for services app

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ServiceRequest',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('request_type', models.CharField(choices=[('checkbook', 'Checkbook Request'), ('statement', 'Statement Request'), ('loan_info', 'Loan Information Request')], max_length=20)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('approved', 'Approved'), ('rejected', 'Rejected'), ('in_progress', 'In Progress'), ('fulfilled', 'Fulfilled'), ('cancelled', 'Cancelled')], default='pending', max_length=20)),
                ('priority', models.CharField(choices=[('low', 'Low'), ('normal', 'Normal'), ('high', 'High'), ('urgent', 'Urgent')], default='normal', max_length=10)),
                ('notes', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('approved_at', models.DateTimeField(blank=True, null=True)),
                ('fulfilled_at', models.DateTimeField(blank=True, null=True)),
                ('fee_amount', models.DecimalField(decimal_places=2, default=0, max_digits=10)),
                ('fee_paid', models.BooleanField(default=False)),
                ('fee_paid_at', models.DateTimeField(blank=True, null=True)),
                ('approved_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='approved_requests', to=settings.AUTH_USER_MODEL)),
                ('fulfilled_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='fulfilled_requests', to=settings.AUTH_USER_MODEL)),
                ('member', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='service_requests', to=settings.AUTH_USER_MODEL)),
                ('requested_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='created_service_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='CheckbookRequest',
            fields=[
                ('servicerequest_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='services.servicerequest')),
                ('quantity', models.PositiveIntegerField(default=1)),
                ('delivery_method', models.CharField(choices=[('pickup', 'Pickup at Branch'), ('mail', 'Mail Delivery'), ('courier', 'Courier Delivery')], default='pickup', max_length=20)),
                ('delivery_address', models.TextField(blank=True)),
                ('special_instructions', models.TextField(blank=True)),
                ('order_number', models.CharField(blank=True, max_length=50, unique=True)),
                ('tracking_number', models.CharField(blank=True, max_length=100)),
                ('estimated_delivery_date', models.DateField(blank=True, null=True)),
            ],
            options={
                'abstract': False,
            },
            bases=('services.servicerequest',),
        ),
        migrations.CreateModel(
            name='LoanInfoRequest',
            fields=[
                ('servicerequest_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='services.servicerequest')),
                ('info_type', models.CharField(choices=[('balance', 'Current Balance'), ('payment_history', 'Payment History'), ('terms', 'Loan Terms and Conditions'), ('amortization', 'Amortization Schedule'), ('full_details', 'Full Loan Details')], max_length=20)),
                ('delivery_method', models.CharField(choices=[('digital', 'Digital (Email)'), ('physical', 'Physical (Mail)'), ('in_person', 'In Person Review')], default='digital', max_length=20)),
                ('loan_account_number', models.CharField(max_length=50)),
                ('authorization_verified', models.BooleanField(default=False)),
                ('verified_at', models.DateTimeField(blank=True, null=True)),
                ('info_delivered', models.BooleanField(default=False)),
                ('delivered_at', models.DateTimeField(blank=True, null=True)),
                ('delivery_notes', models.TextField(blank=True)),
                ('verified_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='verified_loan_requests', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'abstract': False,
            },
            bases=('services.servicerequest',),
        ),
        migrations.CreateModel(
            name='StatementRequest',
            fields=[
                ('servicerequest_ptr', models.OneToOneField(auto_created=True, on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, serialize=False, to='services.servicerequest')),
                ('statement_type', models.CharField(choices=[('monthly', 'Monthly Statement'), ('quarterly', 'Quarterly Statement'), ('annual', 'Annual Statement'), ('custom', 'Custom Date Range')], default='monthly', max_length=20)),
                ('delivery_method', models.CharField(choices=[('digital', 'Digital (Email)'), ('physical', 'Physical (Mail)'), ('both', 'Both Digital and Physical')], default='digital', max_length=20)),
                ('start_date', models.DateField(blank=True, null=True)),
                ('end_date', models.DateField(blank=True, null=True)),
                ('account_number', models.CharField(blank=True, max_length=50)),
                ('email_sent', models.BooleanField(default=False)),
                ('email_sent_at', models.DateTimeField(blank=True, null=True)),
                ('mailed', models.BooleanField(default=False)),
                ('mailed_at', models.DateTimeField(blank=True, null=True)),
                ('tracking_number', models.CharField(blank=True, max_length=100)),
            ],
            options={
                'abstract': False,
            },
            bases=('services.servicerequest',),
        ),
        migrations.AddIndex(
            model_name='servicerequest',
            index=models.Index(fields=['member', '-created_at'], name='services_se_member_i_123456'),
        ),
        migrations.AddIndex(
            model_name='servicerequest',
            index=models.Index(fields=['status', '-created_at'], name='services_se_status__123456'),
        ),
        migrations.AddIndex(
            model_name='servicerequest',
            index=models.Index(fields=['request_type', 'status'], name='services_se_request_123456'),
        ),
    ]