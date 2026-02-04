"""Core services package for Coastal Banking.

This package provides access to all business logic services through
a modular structure.
"""

from .accounts import AccountService
from .calculations import CalculationService
from .dashboard import DashboardService
from .fraud import FraudAlertService
from .loans import LoanService
from .messaging import BankingMessageService
from .operational import ServiceChargeService, ServiceRequestService
from .reporting import ReportService, SystemHealthService
from .transactions import TransactionService

# All services are now successfully modularized.
