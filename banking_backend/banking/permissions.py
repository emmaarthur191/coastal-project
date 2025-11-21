from rest_framework import permissions


class IsManager(permissions.BasePermission):
    """Allows access only to users with the 'manager' role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'manager'


class IsMobileBanker(permissions.BasePermission):
    """Allows access only to users with the 'mobile_banker' role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'mobile_banker'


class IsCashier(permissions.BasePermission):
    """Allows access only to users with the 'cashier' role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'cashier'


class IsOperationsManager(permissions.BasePermission):
    """Allows access only to users with the 'operations_manager' role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'operations_manager'


class IsMemberOrStaff(permissions.BasePermission):
    """Allows access to Members for their own data,  # and all staff."""
    def has_permission(self, request, view):
        # Allow staff roles (manager, banker, ops, cashier) and members
        return request.user and request.user.is_authenticated and request.user.role in ['member', 'manager', 'mobile_banker', 'operations_manager', 'cashier']


class IsMember(permissions.BasePermission):
    """Allows access only to users with the 'member' role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'member'