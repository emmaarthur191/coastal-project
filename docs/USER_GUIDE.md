# Coastal Banking System - User Guide

**Version**: 1.1
**Last Updated**: December 16, 2024
**For**: All User Roles (Customer, Cashier, Mobile Banker, Manager, Operations Manager, Admin)

---

##  Table of Contents

1. [Getting Started](#1-getting-started)
2. [Customer Portal](#2-customer-portal)
3. [Cashier Operations](#3-cashier-operations)
4. [Mobile Banker Portal](#4-mobile-banker-portal)
5. [Operations Manager Dashboard](#5-operations-manager-dashboard)
6. [Manager Dashboard](#6-manager-dashboard)
7. [Administrator Functions](#7-administrator-functions)
8. [Security Features](#8-security-features)
9. [Troubleshooting](#9-troubleshooting)
10. [FAQs](#10-faqs)

---

## 1. Getting Started

### 1.1 Accessing the System

**Production URL**: `https://coastal-project.onrender.com`

**Supported Browsers**:
- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari

### 1.2 Login Process

1. Navigate to the login page
2. Enter your **email address** (not username)
3. Enter your **password**
4. Click **Sign In**
5. If OTP is enabled, enter the code sent to your phone

### 1.3 First-Time Login

For staff members (Cashier, Mobile Banker, Manager, Operations Manager, Admin):
1. You will receive a temporary password via email
2. After first login, you'll be prompted to change your password
3. Create a strong password with:
   - At least 8 characters
   - One uppercase letter
   - One lowercase letter
   - One number
   - One special character

### 1.4 Forgot Password

1. Click **Forgot Password?** on login page
2. Enter your registered email
3. Check your email for reset link
4. Click the link and create a new password

---

## 2. Customer Portal

### 2.1 Dashboard Overview

After login, customers see:
- **Account Summary**: All your accounts with balances
- **Recent Transactions**: Last 10 transactions
- **Quick Actions**: Deposit, Withdraw, Transfer buttons
- **Notifications**: Important alerts and messages

### 2.2 Viewing Accounts

1. Click **Accounts** in the sidebar
2. View all your accounts:
   - **Daily Susu**: Daily savings account
   - **Shares**: Investment shares
   - **Monthly Contribution**: Fixed monthly savings

3. Click on any account to see:
   - Current balance
   - Transaction history
   - Account number
   - Account status

### 2.3 Making Transactions

#### Deposit
1. Click **Deposit** or navigate to Transactions  Deposit
2. Select the account to deposit into
3. Enter the amount
4. Add an optional description
5. Click **Submit**
6. Await cashier approval

#### Withdrawal
1. Click **Withdraw** or navigate to Transactions  Withdraw
2. Select the account to withdraw from
3. Enter the amount (cannot exceed balance)
4. Add optional description
5. Click **Submit**
6. Visit branch to collect cash

#### Transfer Between Accounts
1. Navigate to Transactions  Transfer
2. Select **From Account**
3. Select **To Account**
4. Enter amount
5. Click **Transfer**
6. Confirm the transfer

### 2.4 Loan Applications

1. Navigate to **Loans**  **Apply for Loan**
2. Fill in:
   - Loan amount
   - Purpose
   - Preferred term (months)
3. Upload supporting documents (if required)
4. Click **Submit Application**
5. Track status in **My Loans**

**Loan Statuses**:
| Status | Meaning |
|--------|---------|
| Pending | Awaiting review |
| Approved | Approved, awaiting disbursement |
| Active | Loan is active with payments due |
| Paid Off | Fully repaid |
| Rejected | Application denied |

### 2.5 Service Requests

Request services from the bank:
1. Navigate to **Services**  **New Request**
2. Select request type:
   - Account Statement
   - Cheque Book
   - Card Replacement
   - Address Change
3. Fill in details
4. Submit request
5. Track in **My Requests**

### 2.6 Messaging

Contact the bank:
1. Navigate to **Messages**
2. Click **New Message**
3. Select recipient (Customer Service, Manager)
4. Type your message
5. Click **Send**

Real-time chat is available during business hours.

---

## 3. Cashier Operations

### 3.1 Dashboard Overview

Cashiers see:
- **Cash Drawer Status**: Current balance
- **Today's Transactions**: Summary
- **Pending Requests**: Items requiring action
- **Quick Actions**: Process deposit/withdrawal

### 3.2 Cash Drawer Management

#### Opening the Drawer
1. Navigate to **Cash Drawer**  **Open Drawer**
2. Enter opening balance
3. Count denominations:
   - Enter count for each denomination (200, 100, 50, etc.)
4. Click **Open Drawer**

#### Closing the Drawer
1. Navigate to **Cash Drawer**  **Close Drawer**
2. Count physical cash
3. Enter closing denominations
4. System calculates expected vs. actual
5. Explain any discrepancy
6. Click **Close Drawer**

### 3.3 Processing Deposits

1. Navigate to **Transactions**  **Process Deposit**
2. Search for customer by:
   - Account number
   - Email
   - Phone number
3. Select the account
4. Enter deposit amount
5. Select denominations received
6. Click **Process Deposit**
7. Print receipt for customer

### 3.4 Processing Withdrawals

1. Navigate to **Transactions**  **Process Withdrawal**
2. Search for customer
3. Select the account
4. Enter withdrawal amount
5. Verify customer identity (ID check)
6. Select denominations to give
7. Click **Process Withdrawal**
8. Have customer sign receipt
9. Print receipt

### 3.5 Check Deposits

1. Navigate to **Transactions**  **Check Deposit**
2. Enter check details:
   - Check number
   - Bank name
   - Amount
3. Scan/photograph check
4. Submit for processing
5. Check enters pending status (1-3 business days)

### 3.6 Handling Complaints

1. Navigate to **Complaints**  **New Complaint**
2. Select customer
3. Enter complaint details
4. Assign priority (Low, Medium, High)
5. Submit for manager review

---

## 4. Mobile Banker Portal

### 4.1 Dashboard Overview

**Route**: `/mobile-banker-dashboard`

The Mobile Banker dashboard provides field operations tools:
- **Metrics Panel**: Scheduled visits, completed today, collections due, new applications
- **Main Content Area**: Tab-based navigation
- **Field Toolbox**: Quick action buttons

### 4.2 Available Tabs

| Tab | Icon | Description |
|-----|------|-------------|
| **Registration** |  | Register new clients in the field |
| **My Clients** |  | View assigned clients list |
| **Visits** |  | Schedule and track client visits |
| **Messaging** |  | Secure staff communication |
| **My Payslips** |  | View personal salary slips |

### 4.3 Quick Actions (Field Toolbox)

| Action | Icon | Description |
|--------|------|-------------|
| **Deposit** |  | Process field deposit |
| **Withdraw** |  | Process field withdrawal |
| **New Loan** |  | Start loan application |
| **Collect** |  | Collect loan/savings payment |
| **KYC Doc** |  | Capture customer documents |

### 4.4 Client Registration

1. Navigate to **Registration** tab
2. Fill in customer details:
   - Full name
   - Phone number
   - Address
   - ID type and number
3. Take photo of ID
4. Submit registration
5. Await manager approval

### 4.5 Managing Clients

1. Navigate to **My Clients** tab
2. View all assigned clients
3. Click on client for details:
   - Account information
   - Transaction history
   - Visit history

### 4.6 Field Collections

#### Recording a Deposit
1. Click **Deposit** in Field Toolbox
2. Enter member ID or account number
3. Select deposit type (Daily Susu, Shares, etc.)
4. Enter amount
5. Click **Submit**
6. Receive confirmation with reference number

#### Recording a Withdrawal
1. Click **Withdraw** in Field Toolbox
2. Enter member ID or account number
3. Enter amount
4. Click **Submit**
5. Receive confirmation

### 4.7 Visit Scheduling

1. Navigate to **Visits** tab
2. View scheduled visits
3. Click **Add Stop** to schedule new visit
4. Fill in:
   - Client name
   - Location
   - Date and time
   - Purpose
5. Click **Schedule**

### 4.8 Backend API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `operations/mobile-banker-metrics/` | Dashboard metrics |
| `operations/visit_schedules/` | Visit management |
| `operations/assignments/my_clients/` | Assigned clients |
| `operations/messages/` | Staff messaging |
| `operations/process_deposit/` | Field deposits |
| `operations/process_withdrawal/` | Field withdrawals |

---

## 5. Operations Manager Dashboard

### 5.1 Dashboard Overview

**Route**: `/operations-dashboard`

The Operations Manager has comprehensive access to system operations:
- **Overview Panel**: Key metrics and workflow status
- **13 Feature Tabs**: Full operational control
- **Security Monitoring**: Audit and fraud detection

### 5.2 Available Tabs

| Tab | Icon | Description | Status |
|-----|------|-------------|--------|
| **Overview** |  | Metrics, workflows, branch activity |  Active |
| **Accounts** |  | Account management |  Active |
| **Client Registration** |  | New customer onboarding |  Active |
| **Loan Approvals** |  | Approve/reject loan applications |  Active |
| **Staff IDs** |  | Manage staff identifiers |  Active |
| **Mobile Bankers** |  | Assign clients, view performance |  Active |
| **Branches** |  | Branch activity details |  Coming Soon |
| **Reports** |  | Generate and download reports |  Active |
| **Alerts** |  | System alerts and warnings |  Active |
| **Charges** |  | Service charge configuration |  Active |
| **Products & Services** |  | Manage products/promotions |  Active |
| **Messaging** |  | Secure staff communication |  Active |
| **Security** |  | Audit logs, fraud alerts, sessions |  Active |

### 5.3 Overview Tab

Displays:
- **Key Metrics**: Total transactions, accounts, loans
- **Workflow Status**: Pending items by category
- **Branch Activity**: Performance by branch

### 5.4 Staff Management

#### Managing Staff IDs
1. Navigate to **Staff IDs** tab
2. View all staff members
3. Filter by role (Cashier, Mobile Banker, Manager)
4. Click on staff to view/edit details

#### Mobile Banker Management
1. Navigate to **Mobile Bankers** tab
2. View all mobile bankers
3. Assign clients to bankers
4. Transfer clients between bankers
5. View performance metrics

### 5.5 Reports

1. Navigate to **Reports** tab
2. Select report type:
   - Daily Transaction Summary
   - Monthly Financial Report
   - Loan Portfolio Report
   - User Activity Report
3. Select date range
4. Click **Generate**
5. Download as PDF or CSV

### 5.6 System Alerts

1. Navigate to **Alerts** tab
2. View alerts by type:
   -  Warning
   -  Error
   - ℹ Info
   -  Success
3. Each alert shows:
   - Message
   - Severity
   - Timestamp
   - Alert ID

### 5.7 Service Charges

1. Navigate to **Charges** tab
2. View existing service charges
3. Add new charge:
   - Name
   - Description
   - Type (percentage/fixed)
   - Rate
   - Applicable products
4. Calculate charges for transactions

### 5.8 Security Monitoring

1. Navigate to **Security** tab
2. View sections:
   - **Audit Logs**: All system changes
   - **Login Attempts**: Success/failed logins
   - **Fraud Alerts**: ML-detected + rule-based alerts
   - **Active Sessions**: Currently logged-in users

### 5.9 Backend API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `operations/metrics/` | Operational metrics |
| `operations/branch-activity/` | Branch performance |
| `operations/system-alerts/` | System alerts |
| `operations/workflow-status/` | Workflow tracking |
| `operations/service-charges/` | Charge configuration |
| `operations/generate-report/` | Report generation |

---

## 6. Manager Dashboard

### 6.1 Dashboard Overview

**Route**: `/manager-dashboard`

The Manager Dashboard includes all Operations Manager features plus:
- User management
- Full approval authority
- System configuration

### 6.2 User Management

#### Creating Staff Accounts
1. Navigate to **Users**  **Create Staff**
2. Fill in details:
   - Full name
   - Email
   - Phone number
   - Role (Cashier, Mobile Banker, Operations Manager)
3. Click **Create Account**
4. Staff receives temporary password via email

#### Managing Users
1. Navigate to **Users**  **All Users**
2. Search/filter users
3. Click on user to:
   - View details
   - Edit permissions
   - Reset password
   - Deactivate account

### 6.3 Loan Approvals

1. Navigate to **Approvals**  **Pending Loans**
2. Review loan applications:
   - Customer history
   - Credit score
   - Supporting documents
3. Click **Approve** or **Reject**
4. Add approval notes
5. Customer is notified

### 6.4 Security Monitoring

1. Navigate to **Security** tab
2. View sections:
   - **Audit Logs**: All system changes
   - **Login Attempts**: Success/failed logins
   - **Fraud Alerts**: Suspicious activities (ML + Rule-based)
   - **Active Sessions**: Currently logged-in users

#### Reviewing Fraud Alerts
1. Click on **Fraud Alerts**
2. View alert details:
   - ML Risk Score (for ML-detected alerts prefixed with `[ML-ANOMALY]`)
   - Transaction details
   - User information
3. Actions:
   - Mark as resolved
   - Escalate to admin
   - Contact customer

---

## 7. Administrator Functions

### 7.1 System Configuration

Administrators have access to:
- All Manager functions
- System settings
- ML model management
- Backup/restore

### 7.2 ML Fraud Detection Management

#### Viewing Model Status
1. Navigate to **System**  **ML Fraud Detection**
2. View:
   - Model training date
   - Number of samples used
   - Recent detection statistics
   - Alert breakdown by severity

#### Retraining the Model
1. Navigate to **System**  **ML Fraud Detection**
2. Click **Retrain Model**
3. Training runs in background
4. Check status in Celery task queue

#### Running Batch Analysis
1. Navigate to **System**  **ML Fraud Detection**
2. Click **Batch Analyze**
3. Select time range (e.g., last 24 hours)
4. Click **Start Analysis**
5. View results in Fraud Alerts

### 7.3 Audit & Compliance

1. Navigate to **System**  **Audit Dashboard**
2. View complete audit trail:
   - All model changes (create, update, delete)
   - User actions
   - System events
3. Export for compliance reporting

---

## 8. Security Features

### 8.1 Account Protection

**Password Requirements**:
- Minimum 8 characters
- Mix of uppercase/lowercase
- At least one number
- At least one special character

**Account Lockout**:
- After 5 failed login attempts
- Account locked for 30 minutes
- Contact admin to unlock immediately

### 8.2 Session Security

- Sessions expire after 15 minutes of inactivity
- Single session per user (new login logs out other sessions)
- Secure, httpOnly cookies used for authentication

### 8.3 Two-Factor Authentication (OTP)

If enabled:
1. Enter username/password
2. Receive OTP via SMS
3. Enter OTP within 5 minutes
4. Access granted

### 8.4 Transaction Limits

| User Type | Daily Limit |
|-----------|-------------|
| Customer | 10,000 |
| Cashier | 50,000 |
| Manager | 500,000 |
| Admin | Unlimited |

Limits can be adjusted by administrators.

---

## 9. Troubleshooting

### 9.1 Login Issues

**Problem**: "Invalid credentials" error
- **Solution**: Check email (not username) and password
- **Solution**: Check Caps Lock is off
- **Solution**: Try password reset

**Problem**: "Account locked" message
- **Solution**: Wait 30 minutes or contact admin
- **Solution**: Check if email is correct

**Problem**: OTP not received
- **Solution**: Check phone number on file
- **Solution**: Wait 60 seconds and request new OTP
- **Solution**: Contact admin

### 9.2 Transaction Issues

**Problem**: "Insufficient balance" error
- **Solution**: Check available balance (pending transactions reduce available amount)

**Problem**: "Daily limit exceeded"
- **Solution**: Wait until next day
- **Solution**: Contact manager to increase limit

**Problem**: Transaction stuck on "Pending"
- **Solution**: Refresh page
- **Solution**: Check internet connection
- **Solution**: Contact cashier/support

### 9.3 Page/Loading Issues

**Problem**: Page not loading
- **Solution**: Clear browser cache
- **Solution**: Try different browser
- **Solution**: Check internet connection

**Problem**: "Session Expired" error
- **Solution**: Log in again
- **Solution**: Avoid leaving page idle too long

---

## 10. FAQs

### General

**Q: How do I change my password?**
A: Go to Profile  Security  Change Password

**Q: How do I update my phone number?**
A: Go to Profile  Personal Info  Edit

**Q: Can I access the system on mobile?**
A: Yes, the system is mobile-responsive and works on all devices.

### Accounts

**Q: How do I open a new account?**
A: Visit a branch or contact your mobile banker. Account opening requires identity verification.

**Q: What's the difference between account types?**
A:
- Daily Susu: Daily deposits, higher interest
- Shares: Investment account with dividends
- Monthly Contribution: Fixed monthly deposits

### Transactions

**Q: Why is my transaction pending?**
A: Some transactions require cashier processing or system verification.

**Q: Can I cancel a pending transaction?**
A: Contact customer service within 30 minutes of submission.

### Loans

**Q: How long does loan approval take?**
A: Typically 1-3 business days depending on amount and documentation.

**Q: What documents do I need for a loan?**
A: ID, proof of income, bank statements (last 3 months).

### Security

**Q: I received a fraud alert. What should I do?**
A: Contact customer service immediately. Do not perform transactions until confirmed.

**Q: How do I report suspicious activity?**
A: Use the in-app messaging to contact security team or call the hotline.

---

##  Support Contacts

| Issue | Contact |
|-------|---------|
| General Support | support@coastalbank.com |
| Security Concerns | security@coastalbank.com |
| Technical Issues | tech@coastalbank.com |
| Phone Hotline | +233 XX XXX XXXX |

**Business Hours**: Monday - Friday, 8:00 AM - 5:00 PM GMT

---

*Coastal Banking User Guide v1.1 - December 2024*
