import os
import django
import sys
import json
from decimal import Decimal

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.test import RequestFactory
from core.views import PayslipViewSet, GeneratePayslipView
from core.models import Payslip
from users.models import User
from rest_framework.test import force_authenticate

def verify_payslip_access():
    print("Starting verification of Payslip Access Control...")
    
    # 0. Cleanup Users from previous runs
    User.objects.filter(email__in=['manager@example.com', 'staff1@example.com', 'staff2@example.com']).delete()

    # 1. Setup Data: Manager and Two Staff Members
    manager = User.objects.create_superuser('manager_test', 'manager@example.com', 'pass123')
    manager.role = 'manager'
    manager.save()
    
    staff1 = User.objects.create_user('staff1', 'staff1@example.com', 'pass123', role='cashier', staff_id='ST-001')
    staff2 = User.objects.create_user('staff2', 'staff2@example.com', 'pass123', role='cashier', staff_id='ST-002')
    
    print(f"DEBUG_CTX: Staff1 ID={staff1.id}, Staff2 ID={staff2.id}")

    # 2. Cleanup existing payslips
    del_count, _ = Payslip.objects.filter(staff__in=[staff1, staff2]).delete()
    print(f"DEBUG_CTX: Deleted {del_count} existing payslips for these users.")
    
    # Check if any remain
    rem_count = Payslip.objects.filter(staff=staff2).count()
    print(f"DEBUG_CTX: Remaining payslips for Staff 2: {rem_count}")

    # 3. Generate Payslip for Staff 1 (Manager Action)
    print("Generating Payslip for Staff 1...")
    Payslip.objects.create(
        staff=staff1,
        month=12,
        year=2025,
        pay_period_start='2025-12-01',
        pay_period_end='2025-12-31',
        base_pay=Decimal('5000.00'),
        ssnit_contribution=Decimal('0.00'), # Simplified
        total_deductions=Decimal('0.00'),
        gross_pay=Decimal('5000.00'),
        net_salary=Decimal('5000.00')
    )
    
    factory = RequestFactory()
    
    # 4. Verify Staff 1 CAN see their own payslip
    print("Verifying Staff 1 access to OWN payslip...")
    url = '/api/operations/payslips/my_payslips/' # Based on ViewSet action
    request = factory.get(url)
    force_authenticate(request, user=staff1)
    
    view = PayslipViewSet.as_view({'get': 'my_payslips'})
    response = view(request)
    
    if response.status_code == 200 and len(response.data) == 1:
        print("SUCCESS: Staff 1 found 1 payslip (Own).")
    else:
        print(f"FAILED: Staff 1 access. Status: {response.status_code}, Data: {response.data}")

    # 5. Verify Staff 2 CANNOT see Staff 1's payslip
    # Trying to list all payslips (should filter to own or fail if not allowed)
    print("Verifying Staff 2 access to ALL payslips (expecting empty/filtered)...")
    url_list = '/api/operations/payslips/'
    request2 = factory.get(url_list)
    force_authenticate(request2, user=staff2)
    
    view_list = PayslipViewSet.as_view({'get': 'list'})
    response2 = view_list(request2)

    # PayslipViewSet.get_queryset filters by user if not manager
    # Handle pagination (results key) or list
    if isinstance(response2.data, dict) and 'results' in response2.data:
        data_list = response2.data['results']
    else:
        data_list = response2.data

    if response2.status_code == 200 and len(data_list) == 0:
        print("SUCCESS: Staff 2 sees 0 payslips (Correctly filtered).")
    else:
        print(f"FAILED: Staff 2 saw {len(data_list)} payslips. Should be 0.")
        print(f"  Ghost Payslips Raw Data: {data_list}")



    # 6. Verify Manager CAN see All
    print("Verifying Manager access to ALL payslips...")
    request3 = factory.get(url_list)
    force_authenticate(request3, user=manager)
    response3 = view_list(request3)
    
    if response3.status_code == 200 and len(response3.data) >= 1:
        print("SUCCESS: Manager sees payslips.")
    else:
        print(f"FAILED: Manager access. Status: {response3.status_code}")

    # Cleanup
    manager.delete()
    staff1.delete()
    staff2.delete()
    print("Cleanup completed.")

if __name__ == "__main__":
    verify_payslip_access()
