"""Core models package for Coastal Banking.

This package provides access to all banking-related models through
a modular structure.
"""

# Import reliability models
# Import domain-specific models
from core.models.accounts import (
    Account,
    AccountClosureRequest,
    AccountOpeningRequest,
)
from core.models.fraud import FraudAlert, FraudRule
from core.models.hr import Expense, Payslip
from core.models.loans import Loan
from core.models.marketing import Product, Promotion
from core.models.messaging import (
    BankingMessage,
    BlockedUser,
    ChatMessage,
    ChatRoom,
    Message,
    MessageThread,
    OperationsMessage,
    UserMessagePreference,
)
from core.models.operational import (
    CashAdvance,
    CashDrawer,
    CashDrawerDenomination,
    ClientAssignment,
    ClientRegistration,
    Complaint,
    Device,
    ServiceCharge,
    ServiceRequest,
    VisitSchedule,
)
from core.models.reliability import IdempotencyKey, SmsOutbox
from core.models.reporting import (
    PerformanceMetric,
    Report,
    ReportSchedule,
    ReportTemplate,
    SystemHealth,
)
from core.models.transactions import (
    AccountStatement,
    CheckDeposit,
    Refund,
    Transaction,
)

# Note: models_legacy.py is now deprecated.
# Do not add new models to this package's __init__.py directly;
# create/update the relevant module file instead.
