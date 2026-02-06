"""Loan-related models for Coastal Banking."""

from decimal import Decimal

from django.conf import settings
from django.db import models


class Loan(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("active", "Active"),
        ("paid_off", "Paid Off"),
        ("defaulted", "Defaulted"),
        ("rejected", "Rejected"),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="loans")
    amount = models.DecimalField(max_digits=15, decimal_places=2)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)  # Annual interest rate
    term_months = models.PositiveIntegerField()  # Loan term in months
    purpose = models.TextField(blank=True, null=True, help_text="Purpose of the loan")

    # DETAILED FIELDS (Encrypted)
    date_of_birth_encrypted = models.TextField(blank=True, default="")
    id_type = models.CharField(max_length=50, default="ghana_card")
    id_number_encrypted = models.TextField(blank=True, default="")
    id_number_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    digital_address_encrypted = models.TextField(blank=True, default="")
    town = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)

    @property
    def date_of_birth(self):
        from datetime import datetime
        from core.utils.field_encryption import decrypt_field
        val = decrypt_field(self.date_of_birth_encrypted)
        if val:
            try:
                return datetime.strptime(val, "%Y-%m-%d").date()
            except ValueError:
                return None
        return None

    @date_of_birth.setter
    def date_of_birth(self, value):
        from core.utils.field_encryption import encrypt_field
        if value:
            str_val = value.strftime("%Y-%m-%d") if hasattr(value, "strftime") else str(value)
            self.date_of_birth_encrypted = encrypt_field(str_val)
        else:
            self.date_of_birth_encrypted = ""

    @property
    def id_number(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.id_number_encrypted)

    @id_number.setter
    def id_number(self, value):
        from core.utils.field_encryption import encrypt_field, hash_field
        self.id_number_encrypted = encrypt_field(value) if value else ""
        self.id_number_hash = hash_field(value) if value else ""

    @property
    def digital_address(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.digital_address_encrypted)

    @digital_address.setter
    def digital_address(self, value):
        from core.utils.field_encryption import encrypt_field
        self.digital_address_encrypted = encrypt_field(value) if value else ""

    # Next of Kin 1 (Encrypted)
    next_of_kin_1_name_encrypted = models.TextField(blank=True, default="")
    next_of_kin_1_relationship = models.CharField(max_length=100, blank=True)
    next_of_kin_1_phone_encrypted = models.TextField(blank=True, default="")
    next_of_kin_1_address_encrypted = models.TextField(blank=True, default="")

    @property
    def next_of_kin_1_name(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.next_of_kin_1_name_encrypted)

    @next_of_kin_1_name.setter
    def next_of_kin_1_name(self, value):
        from core.utils.field_encryption import encrypt_field
        self.next_of_kin_1_name_encrypted = encrypt_field(value) if value else ""

    @property
    def next_of_kin_1_phone(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.next_of_kin_1_phone_encrypted)

    @next_of_kin_1_phone.setter
    def next_of_kin_1_phone(self, value):
        from core.utils.field_encryption import encrypt_field
        self.next_of_kin_1_phone_encrypted = encrypt_field(value) if value else ""

    @property
    def next_of_kin_1_address(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.next_of_kin_1_address_encrypted)

    @next_of_kin_1_address.setter
    def next_of_kin_1_address(self, value):
        from core.utils.field_encryption import encrypt_field
        self.next_of_kin_1_address_encrypted = encrypt_field(value) if value else ""

    # Next of Kin 2 (Encrypted)
    next_of_kin_2_name_encrypted = models.TextField(blank=True, default="")
    next_of_kin_2_relationship = models.CharField(max_length=100, blank=True)
    next_of_kin_2_phone_encrypted = models.TextField(blank=True, default="")
    next_of_kin_2_address_encrypted = models.TextField(blank=True, default="")

    @property
    def next_of_kin_2_name(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.next_of_kin_2_name_encrypted)

    @next_of_kin_2_name.setter
    def next_of_kin_2_name(self, value):
        from core.utils.field_encryption import encrypt_field
        self.next_of_kin_2_name_encrypted = encrypt_field(value) if value else ""

    @property
    def next_of_kin_2_phone(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.next_of_kin_2_phone_encrypted)

    @next_of_kin_2_phone.setter
    def next_of_kin_2_phone(self, value):
        from core.utils.field_encryption import encrypt_field
        self.next_of_kin_2_phone_encrypted = encrypt_field(value) if value else ""

    @property
    def next_of_kin_2_address(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.next_of_kin_2_address_encrypted)

    @next_of_kin_2_address.setter
    def next_of_kin_2_address(self, value):
        from core.utils.field_encryption import encrypt_field
        self.next_of_kin_2_address_encrypted = encrypt_field(value) if value else ""

    # Guarantor 1 (Encrypted)
    guarantor_1_name_encrypted = models.TextField(blank=True, default="")
    guarantor_1_id_type = models.CharField(max_length=50, default="ghana_card")
    guarantor_1_id_number_encrypted = models.TextField(blank=True, default="")
    guarantor_1_id_number_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    guarantor_1_phone_encrypted = models.TextField(blank=True, default="")
    guarantor_1_address_encrypted = models.TextField(blank=True, default="")

    @property
    def guarantor_1_name(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.guarantor_1_name_encrypted)

    @guarantor_1_name.setter
    def guarantor_1_name(self, value):
        from core.utils.field_encryption import encrypt_field
        self.guarantor_1_name_encrypted = encrypt_field(value) if value else ""

    @property
    def guarantor_1_id_number(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.guarantor_1_id_number_encrypted)

    @guarantor_1_id_number.setter
    def guarantor_1_id_number(self, value):
        from core.utils.field_encryption import encrypt_field, hash_field
        self.guarantor_1_id_number_encrypted = encrypt_field(value) if value else ""
        self.guarantor_1_id_number_hash = hash_field(value) if value else ""

    @property
    def guarantor_1_phone(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.guarantor_1_phone_encrypted)

    @guarantor_1_phone.setter
    def guarantor_1_phone(self, value):
        from core.utils.field_encryption import encrypt_field
        self.guarantor_1_phone_encrypted = encrypt_field(value) if value else ""

    @property
    def guarantor_1_address(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.guarantor_1_address_encrypted)

    @guarantor_1_address.setter
    def guarantor_1_address(self, value):
        from core.utils.field_encryption import encrypt_field
        self.guarantor_1_address_encrypted = encrypt_field(value) if value else ""

    # Guarantor 2 (Encrypted)
    guarantor_2_name_encrypted = models.TextField(blank=True, default="")
    guarantor_2_id_type = models.CharField(max_length=50, default="ghana_card")
    guarantor_2_id_number_encrypted = models.TextField(blank=True, default="")
    guarantor_2_id_number_hash = models.CharField(max_length=64, blank=True, default="", db_index=True)
    guarantor_2_phone_encrypted = models.TextField(blank=True, default="")
    guarantor_2_address_encrypted = models.TextField(blank=True, default="")

    @property
    def guarantor_2_name(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.guarantor_2_name_encrypted)

    @guarantor_2_name.setter
    def guarantor_2_name(self, value):
        from core.utils.field_encryption import encrypt_field
        self.guarantor_2_name_encrypted = encrypt_field(value) if value else ""

    @property
    def guarantor_2_id_number(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.guarantor_2_id_number_encrypted)

    @guarantor_2_id_number.setter
    def guarantor_2_id_number(self, value):
        from core.utils.field_encryption import encrypt_field, hash_field
        self.guarantor_2_id_number_encrypted = encrypt_field(value) if value else ""
        self.guarantor_2_id_number_hash = hash_field(value) if value else ""

    @property
    def guarantor_2_phone(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.guarantor_2_phone_encrypted)

    @guarantor_2_phone.setter
    def guarantor_2_phone(self, value):
        from core.utils.field_encryption import encrypt_field
        self.guarantor_2_phone_encrypted = encrypt_field(value) if value else ""

    @property
    def guarantor_2_address(self):
        from core.utils.field_encryption import decrypt_field
        return decrypt_field(self.guarantor_2_address_encrypted)

    @guarantor_2_address.setter
    def guarantor_2_address(self, value):
        from core.utils.field_encryption import encrypt_field
        self.guarantor_2_address_encrypted = encrypt_field(value) if value else ""

    # Financial Info
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    employment_status = models.CharField(max_length=50, default="employed")
    outstanding_balance = models.DecimalField(max_digits=15, decimal_places=2, default=Decimal("0.00"))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_loan"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "-created_at"], name="loan_user_idx"),
            models.Index(fields=["status", "-created_at"], name="loan_status_idx"),
        ]

    def __str__(self):
        return f"Loan {self.id} - {self.user.username} - {self.amount} ({self.status})"
