"""Core models package for Coastal Banking.

This package provides access to all banking-related models through
a modular structure.
"""

# Import reliability models
# Import domain-specific models
from core.models.accounts import (  # noqa: F401
    Account,
    AccountClosureRequest,
    AccountOpeningRequest,
)
from core.models.fraud import FraudAlert, FraudRule  # noqa: F401
from core.models.hr import Expense, Payslip  # noqa: F401
from core.models.loans import Loan  # noqa: F401
from core.models.marketing import Product, Promotion  # noqa: F401
from core.models.messaging import (  # noqa: F401
    BankingMessage,
    BlockedUser,
    ChatMessage,
    ChatRoom,
    Message,
    MessageThread,
    OperationsMessage,
    UserMessagePreference,
)
from core.models.operational import (  # noqa: F401
    CashAdvance,
    CashDrawer,
    CashDrawerDenomination,
    ClientAssignment,
    Complaint,
    Device,
    ServiceCharge,
    ServiceRequest,
    VisitSchedule,
)
from core.models.reliability import GlobalSequence, IdempotencyKey, SmsOutbox  # noqa: F401
from core.models.reporting import (  # noqa: F401
    PerformanceMetric,
    Report,
    ReportSchedule,
    ReportTemplate,
    SystemHealth,
)
from core.models.transactions import (  # noqa: F401
    AccountStatement,
    CheckDeposit,
    Refund,
    Transaction,
)

# Note: models_legacy.py is now deprecated.
# Do not add new models to this package's __init__.py directly;
# create/update the relevant module file instead.
