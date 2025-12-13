
import os
from django.utils import timezone  # Will rely on string replacement, this import is just for show in script context if run within django, but we run standalone

path = r"e:\coastal\banking_backend\core\models.py"
with open(path, "rb") as f:
    content = f.read()

# Find the end of BlockedUser string
target_bytes = b'return f"{self.blocker.username} blocked {self.blocked.username}"'
loc = content.find(target_bytes)
if loc != -1:
    end_point = loc + len(target_bytes)
    # Truncate after this
    base_content = content[:end_point]
    
    # New content
    new_code = """

class Expense(models.Model):
    \"\"\"Model for tracking operational expenses.\"\"\"
    CATEGORY_CHOICES = [
        ('Operational', 'Operational'),
        ('Utilities', 'Utilities'),
        ('Payroll', 'Payroll'),
        ('Maintenance', 'Maintenance'),
        ('Marketing', 'Marketing'),
        ('Other', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]

    category = models.CharField(max_length=50, choices=CATEGORY_CHOICES, default='Operational')
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    date = models.DateField(default=timezone.now)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction = models.OneToOneField(Transaction, on_delete=models.SET_NULL, null=True, blank=True, related_name='expense')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.category}: {self.amount} on {self.date}"
"""
    with open(path, "wb") as f:
        f.write(base_content + new_code.encode('utf-8'))
    print("Fixed.")
else:
    print("Target not found.")
