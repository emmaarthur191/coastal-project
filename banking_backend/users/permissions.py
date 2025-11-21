from rest_framework import permissions
from rest_framework.exceptions import PermissionDenied


class BaseRolePermission(permissions.BasePermission):
    """Base class for role-based permissions."""
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Check if account is locked
        if request.user.is_account_locked():
            raise PermissionDenied("Account is temporarily locked due to multiple failed login attempts.")
        
        # Check if user is active
        if not request.user.is_active:
            raise PermissionDenied("Account is deactivated.")
        
        return True


class IsCustomer(BaseRolePermission):
    """Allow access only to customers/users."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == 'customer'


class IsCashier(BaseRolePermission):
    """Allow access only to cashiers."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == 'cashier'


class IsMobileBanker(BaseRolePermission):
    """Allow access only to mobile bankers."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == 'mobile_banker'


class IsManager(BaseRolePermission):
    """Allow access only to managers."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == 'manager'


class IsOperationsManager(BaseRolePermission):
    """Allow access only to operations managers."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == 'operations_manager'


class IsAdministrator(BaseRolePermission):
    """Allow access only to administrators."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == 'administrator'


class IsSuperuser(BaseRolePermission):
    """Allow access only to superusers."""

    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role == 'superuser'


# Hierarchical Permissions (Access to own level and above)
class IsCashierOrHigher(BaseRolePermission):
    """Allow access to cashiers and higher roles."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ['cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator']


class IsMobileBankerOrHigher(BaseRolePermission):
    """Allow access to mobile bankers and higher roles."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ['mobile_banker', 'manager', 'operations_manager', 'administrator']


class IsManagerOrHigher(BaseRolePermission):
    """Allow access to managers and higher roles."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ['manager', 'operations_manager', 'administrator']


class IsOperationsManagerOrHigher(BaseRolePermission):
    """Allow access to operations managers and administrators."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role in ['operations_manager', 'administrator']


# Staff Level Permissions (Excludes customers)
class IsStaff(BaseRolePermission):
    """Allow access to all staff roles (cashier and above)."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        return request.user.role != 'customer'


# Role-specific functionality permissions
class CanManageUsers(BaseRolePermission):
    """Permission to manage users (managers and above)."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        # Administrators have full user management access
        if request.user.role == 'administrator':
            return True
        
        # Managers can create and manage users but not administrators
        if request.user.role == 'manager':
            return True
        
        return False


class CanAccessSecurityFeatures(BaseRolePermission):
    """Permission to access security monitoring and configuration."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        return request.user.role in ['operations_manager', 'administrator']


class CanPerformOperationalOversight(BaseRolePermission):
    """Permission for operational oversight and system analytics."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        return request.user.role in ['manager', 'operations_manager', 'administrator']


class CanProcessTransactions(BaseRolePermission):
    """Permission to process transactions."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        return request.user.role in ['cashier', 'mobile_banker', 'manager', 'operations_manager', 'administrator']


class CanProvideRemoteServices(BaseRolePermission):
    """Permission to provide remote banking services."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        return request.user.role in ['mobile_banker', 'manager', 'operations_manager', 'administrator']


class CanSuperviseTeams(BaseRolePermission):
    """Permission to supervise teams and workflows."""
    
    def has_permission(self, request, view):
        if not super().has_permission(request, view):
            return False
        
        return request.user.role in ['manager', 'operations_manager', 'administrator']