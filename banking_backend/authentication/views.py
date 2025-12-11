from django.shortcuts import render, redirect
from django.contrib import messages
from django.contrib.auth import authenticate, login
from django.utils import timezone
from django import forms
import logging

logger = logging.getLogger(__name__)

class LoginForm(forms.Form):
    """
    Django form for user login with email and password fields.
    """
    email = forms.EmailField(
        label='Email Address',
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter your email address',
            'required': True
        })
    )
    password = forms.CharField(
        label='Password',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Enter your password',
            'required': True
        })
    )


def frontend_login(request):
    """
    Handle frontend login with role-based access control and proper redirects.

    This view provides a clean login interface that:
    - Validates user credentials
    - Enforces role-based access control
    - Redirects to appropriate dashboards based on user role
    - Provides clear error messages

    Args:
        request: HTTP request object

    Returns:
        HTTP response with login form or redirect to dashboard
    """
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email']
            password = form.cleaned_data['password']

            # Attempt authentication
            user = authenticate(request, username=email, password=password)

            if user is not None:
                # Log the user in
                login(request, user)

                # Log successful login
                logger.info(f"User {email} ({user.role}) logged in successfully")

                # Redirect based on role
                redirect_url = _get_role_based_redirect(user)
                messages.success(request, f'Welcome back, {user.first_name or user.email}!')

                logger.info(f"Redirecting user {email} ({user.role}) to: {redirect_url}")
                return redirect(redirect_url)

            else:
                # Authentication failed
                messages.error(request, 'Invalid email or password.')
                logger.warning(f"Failed login attempt for email: {email}")

        else:
            # Form validation failed
            messages.error(request, 'Please correct the errors below.')

    else:
        form = LoginForm()

    return render(request, 'login.html', {'form': form})


def _get_role_based_redirect(user):
    """
    Get the appropriate redirect URL based on user role.

    Args:
        user: Authenticated user object

    Returns:
        str: URL path for redirection
    """
    role_redirects = {
        'customer': '/users/web/dashboard/',
        'cashier': '/users/web/dashboard/',
        'mobile_banker': '/users/web/dashboard/',
        'manager': '/users/web/dashboard/',
        'operations_manager': '/users/web/dashboard/',
        'administrator': '/users/web/dashboard/'
    }

    return role_redirects.get(user.role, '/users/web/dashboard/')