from rest_framework import permissions


class IsOperationsManager(permissions.BasePermission):
    """Allows access only to operations managers."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'operations_manager'


class IsMobileBanker(permissions.BasePermission):
    """Allows access only to mobile bankers."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'mobile_banker'


class IsManagerOrOpsManager(permissions.BasePermission):
    """Allows access to managers and operations managers."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['manager', 'operations_manager']


class CanReviewKYC(permissions.BasePermission):
    """Allows operations managers and managers to review KYC applications."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role in ['operations_manager', 'manager']


class CanManageWorkflows(permissions.BasePermission):
    """Allows operations managers to manage workflows."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'operations_manager'
