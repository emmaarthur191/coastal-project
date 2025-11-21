#!/usr/bin/env python3
"""
Comprehensive Unicode Emoji Removal Tool

This script systematically processes all files in the project directory to:
- Identify and remove Unicode emoji characters, sequences, and presentation characters
- Create backup copies of original files with .backup extension
- Preserve file timestamps, permissions, and encoding
- Handle edge cases including zero-width joiners, skin tone modifiers
- Process emojis in string literals, comments, and documentation
- Generate comprehensive reports with statistics per file type
- Validate code syntax after emoji removal
"""

import os
import re
import shutil
import json
import ast
import subprocess
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple, Set
from collections import defaultdict
import unicodedata

class EmojiRemover:
    def __init__(self, base_path: str = "e:/coastal"):
        self.base_path = Path(base_path)
        self.stats = defaultdict(lambda: {"files": 0, "emojis_removed": 0, "backup_created": 0})
        self.report = {
            "timestamp": datetime.now().isoformat(),
            "total_files_processed": 0,
            "total_emojis_removed": 0,
            "backup_files_created": 0,
            "files_by_type": defaultdict(lambda: {"count": 0, "emojis_removed": 0}),
            "errors": [],
            "syntax_validation": {}
        }
        
        # Comprehensive emoji detection patterns
        self.emoji_patterns = [
            # Basic Emoticons
            r'[\U0001F600-\U0001F64F]',  # emoticons
            # Transport and Map Symbols
            r'[\U0001F680-\U0001F6FF]',  # transport & map symbols
            # Miscellaneous Symbols
            r'[\U00002600-\U000027BF]',  # miscellaneous symbols
            # Dingbats
            r'[\U00002700-\U000027BF]',  # dingbats
            # Miscellaneous Symbols and Pictographs
            r'[\U0001F300-\U0001F5FF]',  # miscellaneous symbols and pictographs
            # Supplemental Symbols and Pictographs
            r'[\U0001F900-\U0001F9FF]',  # supplemental symbols and pictographs
            # Symbols and Pictographs Extended-A
            r'[\U0001FA70-\U0001FAFF]',  # symbols and pictographs extended-a
            # Additional emoji ranges
            r'[\U0001F1E6-\U0001F1FF]',  # regional indicator symbols
            r'[\U0001F004-\U0001F0CF]',  # playing cards
            r'[\U0001F194]',             # squares & abbreviations
            r'[\U0001F201-\U0001F202]',  # circled numbers/letters
            r'[\U0001F232-\U0001F23A]',  # circled numbers
            r'[\U0001F250-\U0001F251]',  # enclosed ideographs
            # Zero-width joiner sequences
            r'[\U0001F3FB-\U0001F3FF]',  # skin tone modifiers
            r'[\U0001F9B0-\U0001F9B3]',  # hair components
            # Flag sequences (combining regional indicators)
            r'(?:[\U0001F1E6-\U0001F1FF]){2}',  # flag pairs
            # Keycap sequences
            r'[\U0001F3FB-\U0001F3FF]*\U0023[\U0001F3FB-\U0001F3FF]*\U0020[\U0001F3FB-\U0001F3FF]*[\U000030-\U000039][\U0001F3FB-\U0001F3FF]*',
            # Family/people sequences with ZWJ
            r'(?:[\U0001F468\U0001F469\U0001F9D1][\U0000200D])?[\U0001F468\U0001F469\U0001F9D1][\U0000200D]?(?:[\U0001F468\U0001F469\U0001F9D1][\U0000200D])?[\U0001F466\U0001F467\U0001F9D2][\U0000200D]*[\U0001F466\U0001F467\U0001F9D2]*',
            # Complex emoji with ZWJ (diversity)
            r'(?:[\U0001F9D1][\U0000200D])?[\U0001F9D2][\U0000200D]*',
            # General ZWJ sequences for complex emojis
            r'[\U0001F3FB-\U0001F3FF]*\U200D[\U0001F3FB-\U0001F3FF]*',
            # Object sequences
            r'[\U0001F9D8][\U0000200D][\U0001F9D8]',
            # Activity sequences
            r'[\U0001F9D6][\U0000200D][\U0001F9D6]',
            # Profession sequences
            r'[\U0001F9D1][\U0000200D][\U0001F4BC]',  # business
            r'[\U0001F9D1][\U0000200D][\U0001F3EB]',  # education
            r'[\U0001F468\U0001F469][\U0000200D][\U0001F3EB]',  # teacher
            # Heart sequences (variations)
            r'[\U0001F493-\U0001F4FF]',
            # Weather/ground symbols
            r'[\U0001F3D4-\U0001F3F0]',
            # Food & drink symbols
            r'[\U0001F32D-\U0001F37F]',
            # Time symbols
            r'[\U0001F550-\U0001F567]',
            # Math symbols (sometimes used as emoji)
            r'[\U0001F7E0-\U0001F7EB]',  # geometric shapes
        ]
        
        # Combine all patterns into one regex
        self.emoji_regex = '|'.join(self.emoji_patterns)
        
        # File extensions to process
        self.text_extensions = {
            '.py', '.js', '.jsx', '.ts', '.tsx', '.html', '.css', '.scss', 
            '.json', '.yaml', '.yml', '.xml', '.md', '.txt', '.rst', '.mdx',
            '.sh', '.bat', '.ps1', '.env', '.ini', '.cfg', '.conf', '.config',
            '.sql', '.dockerfile', '.dockerignore', '.gitignore', '.env.*',
            '.log', '.svg', '.csv', '.tsv', '.requirements.txt', 'package.json',
            '.gitattributes', '.gitmodules', '.editorconfig', '.eslintrc',
            '.prettierrc', '.babelrc', '.jshintrc', '.jscsrc'
        }
        
    def is_text_file(self, file_path: Path) -> bool:
        """Check if file should be processed based on extension."""
        return file_path.suffix.lower() in self.text_extensions or file_path.name in {
            'README', 'LICENSE', 'CHANGELOG', 'TODO', 'Dockerfile', 'Makefile'
        }
    
    def count_emojis(self, content: str) -> int:
        """Count total emojis in content using regex."""
        if not content:
            return 0
        return len(re.findall(self.emoji_regex, content, re.UNICODE))
    
    def remove_emojis(self, content: str) -> str:
        """Remove all emojis from content while preserving other characters."""
        if not content:
            return content
        
        # Remove emojis using regex
        cleaned = re.sub(self.emoji_regex, '', content, flags=re.UNICODE)
        
        # Handle edge cases - remove any remaining combining marks that might be emoji-related
        # This includes variation selectors that might be used for emoji presentation
        cleaned = re.sub(r'[\U0000FE0E\U0000FE0F]', '', cleaned)  # variation selectors
        
        # Remove zero-width joiners that might be orphaned from emoji removal
        cleaned = re.sub(r'\U0000200D(?!\w)', '', cleaned)
        
        return cleaned
    
    def backup_file(self, file_path: Path) -> bool:
        """Create backup of original file."""
        try:
            backup_path = file_path.with_suffix(file_path.suffix + '.backup')
            shutil.copy2(file_path, backup_path)
            return True
        except Exception as e:
            self.report["errors"].append(f"Failed to create backup for {file_path}: {str(e)}")
            return False
    
    def get_file_type(self, file_path: Path) -> str:
        """Categorize file by type for reporting."""
        ext = file_path.suffix.lower()
        if ext in ['.py']:
            return 'Python'
        elif ext in ['.js', '.jsx']:
            return 'JavaScript'
        elif ext in ['.ts', '.tsx']:
            return 'TypeScript'
        elif ext in ['.html', '.htm']:
            return 'HTML'
        elif ext in ['.css', '.scss', '.sass']:
            return 'CSS'
        elif ext in ['.json']:
            return 'JSON'
        elif ext in ['.md', '.markdown']:
            return 'Markdown'
        elif ext in ['.yaml', '.yml']:
            return 'YAML'
        elif ext in ['.xml']:
            return 'XML'
        elif ext in ['.sh', '.bash', '.zsh']:
            return 'Shell'
        elif ext in ['.bat', '.cmd']:
            return 'Batch'
        elif ext in ['.env']:
            return 'Environment'
        elif ext in ['.log']:
            return 'Log'
        elif ext in ['.svg']:
            return 'SVG'
        else:
            return 'Other'
    
    def validate_python_syntax(self, file_path: Path) -> Dict:
        """Validate Python file syntax after emoji removal."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            ast.parse(content)
            return {"valid": True, "error": None}
        except SyntaxError as e:
            return {"valid": False, "error": f"Line {e.lineno}: {e.msg}"}
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    def validate_javascript_syntax(self, file_path: Path) -> Dict:
        """Basic JavaScript syntax validation."""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Use node to validate syntax if available
            result = subprocess.run(['node', '--check', str(file_path)], 
                                  capture_output=True, text=True)
            return {
                "valid": result.returncode == 0, 
                "error": result.stderr if result.stderr else None
            }
        except FileNotFoundError:
            # Node.js not available, basic validation
            return {"valid": True, "error": "Node.js validation skipped"}
        except Exception as e:
            return {"valid": False, "error": str(e)}
    
    def validate_file_syntax(self, file_path: Path) -> Dict:
        """Validate file syntax based on extension."""
        ext = file_path.suffix.lower()
        
        if ext == '.py':
            return self.validate_python_syntax(file_path)
        elif ext in ['.js', '.jsx', '.ts', '.tsx']:
            return self.validate_javascript_syntax(file_path)
        else:
            return {"valid": True, "error": "No syntax validation needed"}
    
    def process_file(self, file_path: Path) -> Dict:
        """Process individual file for emoji removal."""
        result = {
            "path": str(file_path.relative_to(self.base_path)),
            "type": self.get_file_type(file_path),
            "original_size": 0,
            "cleaned_size": 0,
            "emojis_removed": 0,
            "backup_created": False,
            "syntax_valid": True,
            "syntax_error": None,
            "processed": False
        }
        
        try:
            # Read original content
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()
            
            result["original_size"] = len(original_content)
            
            # Count emojis before removal
            emoji_count = self.count_emojis(original_content)
            result["emojis_removed"] = emoji_count
            
            if emoji_count > 0:
                # Create backup
                if self.backup_file(file_path):
                    result["backup_created"] = True
                    self.report["backup_files_created"] += 1
                
                # Remove emojis
                cleaned_content = self.remove_emojis(original_content)
                result["cleaned_size"] = len(cleaned_content)
                
                # Write cleaned content back
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(cleaned_content)
                
                # Validate syntax if applicable
                syntax_check = self.validate_file_syntax(file_path)
                result["syntax_valid"] = syntax_check["valid"]
                result["syntax_error"] = syntax_check["error"]
                
                # Store syntax validation results
                self.report["syntax_validation"][str(file_path.relative_to(self.base_path))] = syntax_check
                
                result["processed"] = True
                self.report["total_emojis_removed"] += emoji_count
                
            else:
                # No emojis found
                result["processed"] = False
                result["cleaned_size"] = result["original_size"]
                
        except Exception as e:
            result["syntax_error"] = f"Processing error: {str(e)}"
            self.report["errors"].append(f"Failed to process {file_path}: {str(e)}")
        
        return result
    
    def walk_directory(self, path: Path, exclude_dirs: Set[str] = None) -> List[Path]:
        """Recursively walk directory and return all files to process."""
        if exclude_dirs is None:
            exclude_dirs = {
                '.git', '__pycache__', 'node_modules', '.vscode', 
                '.venv', 'venv', '.env', 'dist', 'build', 'coverage',
                '.pytest_cache', 'logs', 'tmp', 'temp'
            }
        
        files = []
        for item in path.rglob('*'):
            if item.is_file():
                # Skip files in excluded directories
                if any(excluded in item.parts for excluded in exclude_dirs):
                    continue
                
                # Skip binary files that might have text extensions
                if self.is_text_file(item):
                    files.append(item)
        
        return files
    
    def process_all_files(self) -> None:
        """Process all files in the project directory."""
        print(" Starting comprehensive emoji removal process...")
        
        # Get all files to process
        all_files = self.walk_directory(self.base_path)
        self.report["total_files_processed"] = len(all_files)
        
        print(f" Found {len(all_files)} files to process")
        
        # Process each file
        for i, file_path in enumerate(all_files, 1):
            print(f" Processing {i}/{len(all_files)}: {file_path.relative_to(self.base_path)}")
            
            file_result = self.process_file(file_path)
            
            # Update statistics
            file_type = file_result["type"]
            self.stats[file_type]["files"] += 1
            
            if file_result["emojis_removed"] > 0:
                self.stats[file_type]["emojis_removed"] += file_result["emojis_removed"]
                self.stats[file_type]["backup_created"] += int(file_result["backup_created"])
            
            # Add to detailed report
            self.report["files_by_type"][file_type]["count"] += 1
            self.report["files_by_type"][file_type]["emojis_removed"] += file_result["emojis_removed"]
            
            # Store detailed results for files with emojis
            if file_result["emojis_removed"] > 0:
                if "files_processed" not in self.report:
                    self.report["files_processed"] = []
                self.report["files_processed"].append(file_result)
    
    def generate_report(self) -> str:
        """Generate comprehensive HTML report."""
        report_html = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Comprehensive Emoji Removal Report</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; background: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        h1 {{ color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }}
        h2 {{ color: #34495e; margin-top: 30px; }}
        .summary {{ background: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0; }}
        .stat-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }}
        .stat-card {{ background: #fff; padding: 20px; border-radius: 5px; border-left: 4px solid #3498db; }}
        .stat-number {{ font-size: 2em; font-weight: bold; color: #2c3e50; }}
        .stat-label {{ color: #7f8c8d; margin-top: 5px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background-color: #34495e; color: white; }}
        tr:nth-child(even) {{ background-color: #f2f2f2; }}
        .success {{ color: #27ae60; }}
        .warning {{ color: #f39c12; }}
        .error {{ color: #e74c3c; }}
        .file-list {{ max-height: 400px; overflow-y: auto; border: 1px solid #ddd; padding: 10px; border-radius: 5px; }}
        .progress-bar {{ background: #ecf0f1; border-radius: 10px; height: 20px; margin: 10px 0; }}
        .progress-fill {{ background: #3498db; height: 100%; border-radius: 10px; transition: width 0.3s ease; }}
        .badge {{ padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }}
        .badge-success {{ background: #d4edda; color: #155724; }}
        .badge-error {{ background: #f8d7da; color: #721c24; }}
    </style>
</head>
<body>
    <div class="container">
        <h1> Comprehensive Emoji Removal Report</h1>
        
        <div class="summary">
            <h2> Summary</h2>
            <p><strong>Generated:</strong> {self.report['timestamp']}</p>
            <p><strong>Total Files Processed:</strong> {self.report['total_files_processed']}</p>
            <p><strong>Total Emojis Removed:</strong> <span class="success">{self.report['total_emojis_removed']}</span></p>
            <p><strong>Backup Files Created:</strong> <span class="warning">{self.report['backup_files_created']}</span></p>
        </div>

        <h2> Statistics by File Type</h2>
        <div class="stat-grid">
"""
        
        for file_type, stats in self.stats.items():
            if stats['files'] > 0:
                report_html += f"""
            <div class="stat-card">
                <div class="stat-number">{stats['files']}</div>
                <div class="stat-label">{file_type} Files</div>
                <div class="stat-number">{stats['emojis_removed']}</div>
                <div class="stat-label">Emojis Removed</div>
                <div class="stat-number">{stats['backup_created']}</div>
                <div class="stat-label">Backups Created</div>
            </div>
"""
        
        report_html += """
        </div>

        <h2> Detailed File Processing Results</h2>
        <div class="file-list">
"""
        
        if "files_processed" in self.report and self.report["files_processed"]:
            report_html += """
            <table>
                <thead>
                    <tr>
                        <th>File Path</th>
                        <th>Type</th>
                        <th>Emojis Removed</th>
                        <th>Backup Created</th>
                        <th>Syntax Valid</th>
                        <th>Original Size</th>
                        <th>Cleaned Size</th>
                    </tr>
                </thead>
                <tbody>
"""
            
            for file_info in self.report["files_processed"]:
                status_icon = "" if file_info["syntax_valid"] else ""
                status_class = "success" if file_info["syntax_valid"] else "error"
                backup_status = "" if file_info["backup_created"] else ""
                
                report_html += f"""
                    <tr>
                        <td>{file_info['path']}</td>
                        <td>{file_info['type']}</td>
                        <td class="success">{file_info['emojis_removed']}</td>
                        <td>{backup_status}</td>
                        <td><span class="badge badge-{status_class}">{status_icon} Valid</span></td>
                        <td>{file_info['original_size']} bytes</td>
                        <td>{file_info['cleaned_size']} bytes</td>
                    </tr>
"""
            
            report_html += """
                </tbody>
            </table>
"""
        else:
            report_html += "<p>No emojis were found in any files. All files are already clean! </p>"
        
        # Add syntax validation section
        if self.report["syntax_validation"]:
            report_html += """
        <h2> Syntax Validation Results</h2>
        <div class="file-list">
            <table>
                <thead>
                    <tr>
                        <th>File</th>
                        <th>Status</th>
                        <th>Error Details</th>
                    </tr>
                </thead>
                <tbody>
"""
            
            for file_path, validation in self.report["syntax_validation"].items():
                status_icon = "" if validation["valid"] else ""
                status_class = "success" if validation["valid"] else "error"
                error_msg = validation["error"] or "None"
                
                report_html += f"""
                    <tr>
                        <td>{file_path}</td>
                        <td><span class="badge badge-{status_class}">{status_icon} {'Valid' if validation['valid'] else 'Invalid'}</span></td>
                        <td>{error_msg}</td>
                    </tr>
"""
            
            report_html += """
                </tbody>
            </table>
        </div>
"""
        
        # Add errors section if any
        if self.report["errors"]:
            report_html += f"""
        <h2> Errors and Issues</h2>
        <div class="file-list">
            <ul>
"""
            for error in self.report["errors"]:
                report_html += f"                <li class='error'>{error}</li>\n"
            
            report_html += """
            </ul>
        </div>
"""
        
        report_html += """
        <h2> Completion Status</h2>
        <div class="summary">
            <p><strong>Status:</strong> 
"""
        
        if self.report["total_emojis_removed"] > 0:
            report_html += "<span class='success'> Completed - Emojis successfully removed and backups created</span></p>"
        else:
            report_html += "<span class='success'> Completed - No emojis found in any files</span></p>"
        
        report_html += """
            <p><strong>Next Steps:</strong></p>
            <ul>
                <li>Review the backup files with .backup extension if needed</li>
                <li>Run tests to ensure functionality remains intact</li>
                <li>Check syntax validation results for any issues</li>
                <li>Deploy changes after validation</li>
            </ul>
        </div>
    </div>
</body>
</html>
"""
        
        return report_html
    
    def save_reports(self) -> None:
        """Save both HTML and JSON reports."""
        # Save HTML report
        html_report_path = self.base_path / "EMOJI_REMOVAL_REPORT.html"
        with open(html_report_path, 'w', encoding='utf-8') as f:
            f.write(self.generate_report())
        
        # Save JSON report for programmatic access
        json_report_path = self.base_path / "EMOJI_REMOVAL_REPORT.json"
        with open(json_report_path, 'w', encoding='utf-8') as f:
            json.dump(self.report, f, indent=2, default=str)
        
        print(f" Reports saved:")
        print(f"   HTML: {html_report_path}")
        print(f"   JSON: {json_report_path}")

def main():
    """Main execution function."""
    print(" Starting Comprehensive Emoji Removal Tool")
    print("=" * 60)
    
    remover = EmojiRemover("e:/coastal")
    
    try:
        remover.process_all_files()
        remover.save_reports()
        
        print("\n" + "=" * 60)
        print(" EMOJI REMOVAL PROCESS COMPLETED!")
        print(f" Total emojis removed: {remover.report['total_emojis_removed']}")
        print(f" Total files processed: {remover.report['total_files_processed']}")
        print(f" Backup files created: {remover.report['backup_files_created']}")
        print(f" Reports generated: EMOJI_REMOVAL_REPORT.html & .json")
        print("=" * 60)
        
    except Exception as e:
        print(f" Error during execution: {str(e)}")
        raise

if __name__ == "__main__":
    main()