"""Core serializers package for Coastal Banking.

This package provides access to all banking-related serializers through
a modular structure.
"""

from core.serializers.accounts import (
    AccountClosureRequestSerializer,
    AccountOpeningRequestSerializer,
    AccountSerializer,
)
from core.serializers.fraud import (
    FraudAlertSerializer,
    FraudRuleSerializer,
)
from core.serializers.hr import (
    ExpenseSerializer,
    PayslipSerializer,
)
from core.serializers.loans import LoanSerializer
from core.serializers.marketing import (
    ProductSerializer,
    PromotionSerializer,
)
from core.serializers.messaging import (
    BankingMessageSerializer,
    BlockedUserSerializer,
    MessageSerializer,
    MessageThreadSerializer,
    UserMessagePreferenceSerializer,
)
from core.serializers.operational import (
    CashAdvanceSerializer,
    CashDrawerDenominationSerializer,
    CashDrawerSerializer,
    ClientAssignmentSerializer,
    ComplaintSerializer,
    DeviceSerializer,
    ServiceRequestSerializer,
)
from core.serializers.reporting import (
    PerformanceMetricSerializer,
    ReportScheduleSerializer,
    ReportSerializer,
    ReportTemplateSerializer,
    SystemHealthSerializer,
)
from core.serializers.transactions import (
    AccountStatementSerializer,
    CheckDepositSerializer,
    RefundSerializer,
    TransactionSerializer,
)

# All serializers are now successfully modularized.
