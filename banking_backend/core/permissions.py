from rest_framework.permissions import BasePermission

# Staff roles that have elevated access
STAFF_ROLES = ['staff', 'admin', 'cashier', 'mobile_banker', 'manager', 'operations_manager']

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role == 'admin' or request.user.is_superuser
        )

class IsStaff(BasePermission):
    """Allows access to any staff member including cashiers, managers, etc."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role in STAFF_ROLES or request.user.is_staff
        )

class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.role == 'customer'

class IsStaffOrCustomer(BasePermission):
    """Allows access to both staff and customers - for endpoints like transactions that both need."""
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.role == 'customer' or 
            request.user.role in STAFF_ROLES or 
            request.user.is_staff
        )


class IsOwnerOrStaff(BasePermission):
    """
    Object-level permission to only allow owners of an object or staff to access it.
    
    Assumes the model instance has a `user` attribute.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # Staff can access any object
        if request.user.role in STAFF_ROLES or request.user.is_staff:
            return True
        # Otherwise, only the owner can access
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        return False