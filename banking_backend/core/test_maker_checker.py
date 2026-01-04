from decimal import Decimal

from django.contrib.auth import get_user_model

import pytest

from core.models import CashAdvance

User = get_user_model()


@pytest.fixture
def staff_user_a(db):
    return User.objects.create_user(
        username="staff_a", email="staffa@example.com", password="password123", role="cashier", is_staff=True
    )


@pytest.fixture
def staff_user_b(db):
    return User.objects.create_user(
        username="staff_b", email="staffb@example.com", password="password123", role="cashier", is_staff=True
    )


@pytest.mark.django_db
class TestMakerCheckerEnforcement:
    """Test suite for maker-checker enforcement on cash operations."""

    def test_cash_advance_has_submitted_by_field(self, staff_user_a):
        """Verify CashAdvance model has submitted_by field."""
        cash_advance = CashAdvance.objects.create(
            user=staff_user_a, submitted_by=staff_user_a, amount=Decimal("500.00"), status="pending"
        )

        assert hasattr(cash_advance, "submitted_by")
        assert cash_advance.submitted_by == staff_user_a

    def test_cash_advance_can_track_approver(self, staff_user_a, staff_user_b):
        """Verify CashAdvance tracks who approved it."""
        cash_advance = CashAdvance.objects.create(
            user=staff_user_a, submitted_by=staff_user_a, amount=Decimal("500.00"), status="pending"
        )

        # Simulate approval
        cash_advance.status = "approved"
        cash_advance.approved_by = staff_user_b
        cash_advance.save()

        cash_advance.refresh_from_db()
        assert cash_advance.approved_by == staff_user_b
        assert cash_advance.submitted_by != cash_advance.approved_by

    def test_legacy_cash_advance_without_submitter(self, staff_user_a):
        """Verify legacy cash advances (without submitted_by) can be created."""
        # Legacy cash advance without submitted_by
        cash_advance = CashAdvance.objects.create(
            user=staff_user_a,
            submitted_by=None,  # Legacy record
            amount=Decimal("500.00"),
            status="pending",
        )

        assert cash_advance.submitted_by is None
        assert cash_advance.id is not None
