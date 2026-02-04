"""Loan-related serializers for Coastal Banking."""

from rest_framework import serializers

from core.models.loans import Loan


class LoanSerializer(serializers.ModelSerializer):
    borrower_name = serializers.SerializerMethodField()
    borrower_email = serializers.SerializerMethodField()

    class Meta:
        model = Loan
        fields = [
            "id",
            "user",
            "borrower_name",
            "borrower_email",
            "amount",
            "interest_rate",
            "term_months",
            "purpose",
            "date_of_birth",
            "id_type",
            "id_number",
            "digital_address",
            "town",
            "city",
            "next_of_kin_1_name",
            "next_of_kin_1_relationship",
            "next_of_kin_1_phone",
            "next_of_kin_1_address",
            "next_of_kin_2_name",
            "next_of_kin_2_relationship",
            "next_of_kin_2_phone",
            "next_of_kin_2_address",
            "guarantor_1_name",
            "guarantor_1_id_type",
            "guarantor_1_id_number",
            "guarantor_1_phone",
            "guarantor_1_address",
            "guarantor_2_name",
            "guarantor_2_id_type",
            "guarantor_2_id_number",
            "guarantor_2_phone",
            "guarantor_2_address",
            "monthly_income",
            "employment_status",
            "outstanding_balance",
            "status",
            "approved_at",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "outstanding_balance",
            "status",
            "approved_at",
            "created_at",
            "updated_at",
            "borrower_name",
            "borrower_email",
        ]

    def get_borrower_name(self, obj):
        return obj.user.get_full_name() if obj.user else "Unknown"

    def get_borrower_email(self, obj):
        return obj.user.email if obj.user else ""

    def to_representation(self, instance):
        """Apply PII masking to sensitive fields in API responses."""
        from core.utils import mask_date_of_birth, mask_id_number, mask_income, mask_phone_number

        data = super().to_representation(instance)
        # Mask ID numbers
        data["id_number"] = mask_id_number(data.get("id_number"))
        data["guarantor_1_id_number"] = mask_id_number(data.get("guarantor_1_id_number"))
        data["guarantor_2_id_number"] = mask_id_number(data.get("guarantor_2_id_number"))
        # Mask phone numbers
        data["next_of_kin_1_phone"] = mask_phone_number(data.get("next_of_kin_1_phone"))
        data["next_of_kin_2_phone"] = mask_phone_number(data.get("next_of_kin_2_phone"))
        data["guarantor_1_phone"] = mask_phone_number(data.get("guarantor_1_phone"))
        data["guarantor_2_phone"] = mask_phone_number(data.get("guarantor_2_phone"))
        # Mask income
        data["monthly_income"] = mask_income(data.get("monthly_income"))
        # Mask date of birth
        data["date_of_birth"] = mask_date_of_birth(data.get("date_of_birth"))
        return data

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Loan amount must be positive.")
        return value

    def validate_interest_rate(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Interest rate must be between 0 and 100.")
        return value

    def validate_term_months(self, value):
        if value <= 0:
            raise serializers.ValidationError("Term must be positive.")
        return value
