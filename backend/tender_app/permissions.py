from rest_framework import permissions

class IsCityUser(permissions.BasePermission):
    """
    Custom permission to only allow city users to create and manage tenders.
    """
    def has_permission(self, request, view):
        # Allow superusers full access
        if request.user.is_superuser:
            return True
        # Allow city users to perform any action
        return request.user.is_authenticated and request.user.user_type == 'CITY'

    def has_object_permission(self, request, view, obj):
        # Allow superusers full access
        if request.user.is_superuser:
            return True
        # Allow city users to modify their own tenders
        return request.user.is_authenticated and request.user.user_type == 'CITY'

class IsCompanyUser(permissions.BasePermission):
    """
    Custom permission to only allow company users to create bids.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.user_type == 'COMPANY'

    def has_object_permission(self, request, view, obj):
        # Companies can only modify their own bids
        return obj.company == request.user 

class IsCityUserOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow city users to create and edit tenders.
    Others can view tenders but not modify them.
    """
    def has_permission(self, request, view):
        # Allow anyone to view tenders (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for city users
        return request.user.is_authenticated and request.user.user_type == 'CITY'

    def has_object_permission(self, request, view, obj):
        # Allow anyone to view tenders (GET, HEAD, OPTIONS)
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions only for city users
        return request.user.is_authenticated and request.user.user_type == 'CITY' 