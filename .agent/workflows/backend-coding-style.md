---
description: Backend coding style and conventions for Django/Python
---

# Backend Coding Style Guide

## Structure
- Imports at top of function when only needed locally
- Clear section comments (# Get member, # Process transaction, etc.)
- Descriptive docstrings for all views/actions

## Error Handling
- Always use try-except blocks around:
  - User/model lookups
  - Account/database operations
  - Transaction processing
- Return specific error messages

## Response Format
```python
# Success
return Response({
    'status': 'success',
    'data': serializer.data,
    'message': 'Operation successful'
})

# Error
return Response({'error': 'Descriptive message'}, status=400)
```

## Status Codes
- Use simple integers: 200, 400, 404, 500
- Not verbose: status.HTTP_400_BAD_REQUEST

## Django Shortcuts
- Use `get_or_create()` for account/record creation
- Use `filter().first()` when expecting optional single result
- Use `Decimal(str(amount))` for money operations

## Example Pattern
```python
@action(detail=False, methods=['post'], permission_classes=[IsStaff])
def process(self, request):
    """Clear docstring explaining the action."""
    from decimal import Decimal
    from users.models import User
    
    # Get and validate inputs
    data = request.data.get('field')
    if not data:
        return Response({'error': 'field is required'}, status=400)
    
    # Get related objects
    try:
        obj = Model.objects.get(id=data)
    except Model.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    
    # Process operation
    try:
        # business logic here
        obj.save()
        return Response({'status': 'success', 'data': result})
    except Exception as e:
        return Response({'error': f'Failed: {str(e)}'}, status=500)
```
