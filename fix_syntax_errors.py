#!/usr/bin/env python3
"""
Systematically fix syntax errors in Python files.
Specifically handles comment syntax issues where lines start with a dot followed by text.
"""

import os
import re
import glob

def fix_syntax_errors(file_path):
    """Fix syntax errors in a Python file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Track changes
        changes_made = False
        original_content = content
        
        # Fix lines that start with a dot followed by space and text (invalid comment syntax)
        # This pattern matches lines like: "    . Some comment text"
        pattern = r'^(\s+)\. ([^\n]+)$'
        
        def replace_dot_comment(match):
            nonlocal changes_made
            indent = match.group(1)
            comment_text = match.group(2)
            new_line = f"{indent}# {comment_text}"
            changes_made = True
            return new_line
        
        content = re.sub(pattern, replace_dot_comment, content, flags=re.MULTILINE)
        
        # Also fix inline comments that have malformed syntax like: "value = 300,  minutes in seconds"
        pattern2 = r'(\w+\s*=\s*[^,]+),\s*([a-zA-Z\s]+\w*)'
        def fix_inline_comment(match):
            nonlocal changes_made
            assignment = match.group(1)
            comment = match.group(2).strip()
            # Only fix if it looks like a comment (contains spaces and words)
            if re.match(r'^[a-zA-Z\s]+\w*$', comment) and len(comment.split()) > 1:
                new_line = f"{assignment},  # {comment}"
                changes_made = True
                return new_line
            return match.group(0)
        
        content = re.sub(pattern2, fix_inline_comment, content)
        
        # Write back if changes were made
        if changes_made:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True
        return False
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return False

def find_python_files(directory):
    """Find all Python files in the directory tree."""
    python_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    return python_files

def main():
    """Main function to fix all Python files in the banking_backend directory."""
    backend_dir = 'banking_backend'
    
    if not os.path.exists(backend_dir):
        print(f"Directory {backend_dir} not found!")
        return
    
    print("Fixing syntax errors in Python files...")
    
    python_files = find_python_files(backend_dir)
    fixed_files = []
    
    for file_path in python_files:
        if fix_syntax_errors(file_path):
            fixed_files.append(file_path)
    
    print(f"\nFixed {len(fixed_files)} files:")
    for file_path in fixed_files:
        print(f"  - {file_path}")
    
    if not fixed_files:
        print("No files needed fixing.")
    
    print("\nSyntax error fixing completed!")

if __name__ == "__main__":
    main()