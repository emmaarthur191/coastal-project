from rest_framework import permissions


class IsAdministrator(permissions.BasePermission):
    """Allows access only to users with the 'administrator' role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'administrator'


class IsSuperuser(permissions.BasePermission):
    """Allows access only to users with the 'superuser' role."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'superuser'


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


class IsStaff(permissions.BasePermission):
    """Allows access to all staff roles (manager, mobile_banker, operations_manager, cashier, administrator, superuser)."""
    def has_permission(self, request, view):
        staff_roles = ['manager', 'mobile_banker', 'operations_manager', 'cashier', 'administrator', 'superuser']
        return request.user and request.user.is_authenticated and request.user.role in staff_roles


class IsMemberOrStaff(permissions.BasePermission):
    """Allows access to Members (customers) for their own data and all staff."""
    def has_permission(self, request, view):
        # Allow staff roles and customers (members)
        allowed_roles = ['customer', 'manager', 'mobile_banker', 'operations_manager', 'cashier', 'administrator', 'superuser']
        return request.user and request.user.is_authenticated and request.user.role in allowed_roles


class IsMember(permissions.BasePermission):
    """Allows access only to users with the 'customer' role (members)."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'customer'


class IsManagerOrHigher(permissions.BasePermission):
    """Allows access to managers and higher-level roles."""
    def has_permission(self, request, view):
        higher_roles = ['manager', 'operations_manager', 'administrator', 'superuser']
        return request.user and request.user.is_authenticated and request.user.role in higher_roles


class IsOperationsManagerOrHigher(permissions.BasePermission):
    """Allows access to operations managers and higher-level roles."""
    def has_permission(self, request, view):
        higher_roles = ['operations_manager', 'administrator', 'superuser']
        return request.user and request.user.is_authenticated and request.user.role in higher_roles


class IsAdministratorOrHigher(permissions.BasePermission):
    """Allows access to administrators and superusers."""
    def has_permission(self, request, view):
        higher_roles = ['administrator', 'superuser']
        return request.user and request.user.is_authenticated and request.user.role in higher_roles