
import os

def repair_file(filepath):
    print(f"Repairing {filepath}...")
    try:
        with open(filepath, 'rb') as f:
            content = f.read()
            
        # The corruption likely manifests as null bytes (0x00) interleaved because of UTF-16 LE
        # We need to find where the corruption starts.
        # It's where we appended the new models/views.
        
        # Heuristic: Find the start of the appended content.
        # For models.py, it started with "class VisitSchedule"
        # For views.py, it started with "class OperationsMessagesViewSet"
        
        # But wait, the previous `view_file` showed spaces, which might be visual representation of wide chars or actual spaces.
        # If it was UTF-16 interpreted as UTF-8 or similar, it might look like "c l a s s".
        
        # Let's try to decode as utf-8 (which is standard) and see.
        # If the original file was utf-8 and we appended utf-16, the end of the file is mixed.
        
        # Strategy: distinct "good" part vs "bad" part.
        # Good part is strict ASCII/UTF-8. Bad part has null bytes if it's UTF-16LE.
        
        # Let's check for null bytes.
        if b'\x00' in content:
            print("Null bytes found. Attempting to filter.")
            # We want to keep the top part (good) and fix the bottom part (bad).
            # But simpler: simplest fix is to strip all null bytes from the file?
            # Warning: valid UTF-8 multibyte sequences don't typically contain null bytes unless it's overlong encoding?
            # Actually standard UTF-8 text doesn't have null bytes (except actual nulls).
            # Source code shouldn't have null bytes.
            
            new_content = content.replace(b'\x00', b'')
            
            # Now we have the content without nulls. 
            # But wait, type >> might have added a BOM (FF FE) at the start of the appended part.
            new_content = new_content.replace(b'\xff\xfe', b'')
            
            with open(filepath, 'wb') as f:
                f.write(new_content)
            print("Repaired by removing null bytes and BOMs.")
        else:
            print("No null bytes found. Checking for wide characters/spacing?")
            # If it's just spaces "c l a s s"... 
            # This happens if 'type' output was captured as string then written?
            # No, 'type >>' appends directly.
            pass

    except Exception as e:
        print(f"Error: {e}")

repair_file(r'e:\coastal\banking_backend\core\models.py')
repair_file(r'e:\coastal\banking_backend\core\views.py')
repair_file(r'e:\coastal\banking_backend\core\urls.py')
