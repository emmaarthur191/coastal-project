from django.shortcuts import render, redirect
from django.contrib import messages
import logging
logger = logging.getLogger(__name__)

def frontend_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        # Use the default backend first to see what user we get
        from django.contrib.auth import authenticate, login
        user = authenticate(request, username=username, password=password)

        if user is not None:
            if user.is_superuser:
                messages.error(request, 'Access denied. Superusers can only log in through the admin panel.')
                return render(request, 'login.html')

            login(request, user)
            return redirect('frontend_dashboard')
        else:
            messages.error(request, 'Invalid credentials')

    return render(request, 'login.html')