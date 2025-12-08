"""
Surgical fix for CashAdvance.approve() method to add role-based access control.
"""

def fix_cash_advance_approve():
    file_path = r'e:\coastal\banking_backend\banking\models.py'
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Find the approve method in CashAdvance class (around line 1561-1571)
    # We need to insert the security check after line 1564
    for i, line in enumerate(lines):
        if i >= 1563 and i <= 1565:  # Line 1564 (0-indexed: 1563)
            if 'raise ValidationError("Only pending requests can be approved.")' in line:
                # Insert the security check after this line
                indent = '        '  # 8 spaces
                security_check = [
                    '\n',
                    f'{indent}# Security Fix: Enforce role check\n',
                    f'{indent}if approver.role not in [\'manager\', \'operations_manager\', \'administrator\', \'superuser\']:\n',
                    f'{indent}     raise ValidationError("Insufficient privileges to approve cash advance.")\n',
                ]
                # Insert after the current line
                lines[i+1:i+1] = security_check
                break
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print("Security fix applied successfully!")

if __name__ == '__main__':
    fix_cash_advance_approve()
