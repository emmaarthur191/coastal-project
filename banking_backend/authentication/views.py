from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login
from django.contrib import messages
from django.contrib.auth.forms import AuthenticationForm
import logging
logger = logging.getLogger(__name__)

def frontend_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        print(f"DEBUG: Login attempt - Username: {username}")  # Console debug

        # Use the default backend first to see what user we get
        from django.contrib.auth import authenticate, login
        user = authenticate(request, username=username, password=password)

        print(f"DEBUG: User object: {user}")
        if user:
            print(f"DEBUG: Is superuser: {user.is_superuser}")
            print(f"DEBUG: Is staff: {user.is_staff}")
            print(f"DEBUG: Is active: {user.is_active}")

        if user is not None:
            if user.is_superuser:
                print("DEBUG: Blocking superuser from frontend login")
                messages.error(request, 'Access denied. Superusers can only log in through the admin panel.')
                return render(request, 'login.html')

            login(request, user)
            print("DEBUG: Regular user logged in successfully")
            return redirect('frontend_dashboard')
        else:
            print("DEBUG: Authentication failed")
            messages.error(request, 'Invalid credentials')

    return render(request, 'login.html')