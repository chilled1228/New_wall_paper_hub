#!/usr/bin/env python3
"""
Admin System Launcher - Main entry point for wallpaper admin tools
Provides a simple interface to launch different admin tools
"""

import tkinter as tk
from tkinter import ttk, messagebox
import subprocess
import sys
import os
from pathlib import Path

class AdminLauncher:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Wallpaper Admin System")
        self.root.geometry("600x500")
        self.root.resizable(False, False)
        
        # Set window icon and styling
        self.setup_ui()
        
    def setup_ui(self):
        """Setup the launcher UI"""
        # Main title
        title_frame = ttk.Frame(self.root)
        title_frame.pack(fill=tk.X, padx=20, pady=20)
        
        title_label = ttk.Label(title_frame, text="🖼️ Wallpaper Admin System", 
                               font=("Arial", 20, "bold"))
        title_label.pack()
        
        subtitle_label = ttk.Label(title_frame, text="Complete management suite for your wallpaper website", 
                                 font=("Arial", 10))
        subtitle_label.pack(pady=(5, 0))
        
        # Tools section
        tools_frame = ttk.LabelFrame(self.root, text="🛠️ Administration Tools", padding=20)
        tools_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=(0, 20))
        
        # Publisher tool
        publisher_frame = ttk.Frame(tools_frame)
        publisher_frame.pack(fill=tk.X, pady=10)
        
        ttk.Label(publisher_frame, text="📤 Wallpaper Publisher V2", font=("Arial", 12, "bold")).pack(anchor=tk.W)
        ttk.Label(publisher_frame, text="Upload wallpapers with automatic image optimization and AI metadata generation", 
                 font=("Arial", 9), foreground="gray").pack(anchor=tk.W, pady=(2, 5))
        ttk.Button(publisher_frame, text="Launch Publisher", 
                  command=self.launch_publisher, width=20).pack(anchor=tk.W)
        
        # Separator
        ttk.Separator(tools_frame, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=15)
        
        # Dashboard tool
        dashboard_frame = ttk.Frame(tools_frame)
        dashboard_frame.pack(fill=tk.X, pady=10)
        
        ttk.Label(dashboard_frame, text="📊 Admin Dashboard", font=("Arial", 12, "bold")).pack(anchor=tk.W)
        ttk.Label(dashboard_frame, text="View analytics, manage wallpapers, and monitor system performance", 
                 font=("Arial", 9), foreground="gray").pack(anchor=tk.W, pady=(2, 5))
        ttk.Button(dashboard_frame, text="Launch Dashboard", 
                  command=self.launch_dashboard, width=20).pack(anchor=tk.W)
        
        # Separator
        ttk.Separator(tools_frame, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=15)
        
        # Wallpaper manager tool
        manager_frame = ttk.Frame(tools_frame)
        manager_frame.pack(fill=tk.X, pady=10)
        
        ttk.Label(manager_frame, text="🗂️ Wallpaper Manager", font=("Arial", 12, "bold")).pack(anchor=tk.W)
        ttk.Label(manager_frame, text="Edit, delete, and manage wallpapers with bulk operations and file cleanup", 
                 font=("Arial", 9), foreground="gray").pack(anchor=tk.W, pady=(2, 5))
        ttk.Button(manager_frame, text="Launch Manager", 
                  command=self.launch_manager, width=20).pack(anchor=tk.W)
        
        # Separator
        ttk.Separator(tools_frame, orient=tk.HORIZONTAL).pack(fill=tk.X, pady=15)
        
        # Database tools
        db_frame = ttk.Frame(tools_frame)
        db_frame.pack(fill=tk.X, pady=10)
        
        ttk.Label(db_frame, text="🗄️ Database Management", font=("Arial", 12, "bold")).pack(anchor=tk.W)
        ttk.Label(db_frame, text="Backup, validate, and maintain database integrity", 
                 font=("Arial", 9), foreground="gray").pack(anchor=tk.W, pady=(2, 5))
        
        db_buttons_frame = ttk.Frame(db_frame)
        db_buttons_frame.pack(anchor=tk.W)
        
        ttk.Button(db_buttons_frame, text="Health Check", 
                  command=self.run_health_check, width=15).pack(side=tk.LEFT, padx=(0, 5))
        ttk.Button(db_buttons_frame, text="Create Backup", 
                  command=self.create_backup, width=15).pack(side=tk.LEFT, padx=5)
        ttk.Button(db_buttons_frame, text="CLI Tools", 
                  command=self.open_cli_help, width=15).pack(side=tk.LEFT, padx=5)
        
        # Status and info section
        info_frame = ttk.Frame(self.root)
        info_frame.pack(fill=tk.X, padx=20, pady=(0, 10))
        
        # Environment status
        self.status_label = ttk.Label(info_frame, text="Checking environment...", foreground="blue")
        self.status_label.pack(anchor=tk.W)
        
        # Check environment on startup
        self.check_environment()
        
        # Footer
        footer_frame = ttk.Frame(self.root)
        footer_frame.pack(fill=tk.X, padx=20, pady=(0, 20))
        
        ttk.Label(footer_frame, text="💡 Tip: All tools require .env.local file with proper configuration", 
                 font=("Arial", 8), foreground="gray").pack(anchor=tk.W)
        
        # Exit button
        ttk.Button(footer_frame, text="Exit", command=self.root.quit).pack(side=tk.RIGHT)
    
    def check_environment(self):
        """Check if environment is properly configured"""
        try:
            env_file = Path(".env.local")
            if not env_file.exists():
                self.status_label.config(text="❌ .env.local file not found!", foreground="red")
                return
            
            # Try to import required packages
            import supabase
            import PIL
            import google.generativeai
            import boto3
            
            self.status_label.config(text="✅ Environment configured correctly", foreground="green")
            
        except ImportError as e:
            self.status_label.config(text=f"❌ Missing package: {str(e)}", foreground="red")
        except Exception as e:
            self.status_label.config(text=f"❌ Environment error: {str(e)}", foreground="red")
    
    def launch_publisher(self):
        """Launch the wallpaper publisher"""
        try:
            self.status_label.config(text="🚀 Launching Publisher...", foreground="blue")
            subprocess.Popen([sys.executable, "wallpaper_publisher_v2.py"], cwd=Path(__file__).parent)
            self.status_label.config(text="✅ Publisher launched", foreground="green")
        except Exception as e:
            messagebox.showerror("Launch Error", f"Failed to launch publisher:\n{str(e)}")
            self.status_label.config(text="❌ Launch failed", foreground="red")
    
    def launch_dashboard(self):
        """Launch the admin dashboard"""
        try:
            self.status_label.config(text="🚀 Launching Dashboard...", foreground="blue")
            subprocess.Popen([sys.executable, "admin_dashboard.py"], cwd=Path(__file__).parent)
            self.status_label.config(text="✅ Dashboard launched", foreground="green")
        except Exception as e:
            messagebox.showerror("Launch Error", f"Failed to launch dashboard:\n{str(e)}")
            self.status_label.config(text="❌ Launch failed", foreground="red")
    
    def launch_manager(self):
        """Launch the wallpaper manager"""
        try:
            self.status_label.config(text="🚀 Launching Manager...", foreground="blue")
            subprocess.Popen([sys.executable, "wallpaper_manager.py"], cwd=Path(__file__).parent)
            self.status_label.config(text="✅ Manager launched", foreground="green")
        except Exception as e:
            messagebox.showerror("Launch Error", f"Failed to launch manager:\n{str(e)}")
            self.status_label.config(text="❌ Launch failed", foreground="red")
    
    def run_health_check(self):
        """Run database health check"""
        try:
            self.status_label.config(text="🔍 Running health check...", foreground="blue")
            result = subprocess.run([sys.executable, "database_manager.py", "health"], 
                                  cwd=Path(__file__).parent, capture_output=True, text=True)
            
            if result.returncode == 0:
                messagebox.showinfo("Health Check", "Health check completed successfully!\n\nCheck console for detailed results.")
                self.status_label.config(text="✅ Health check completed", foreground="green")
            else:
                messagebox.showerror("Health Check Error", f"Health check failed:\n{result.stderr}")
                self.status_label.config(text="❌ Health check failed", foreground="red")
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to run health check:\n{str(e)}")
            self.status_label.config(text="❌ Health check failed", foreground="red")
    
    def create_backup(self):
        """Create database backup"""
        try:
            self.status_label.config(text="💾 Creating backup...", foreground="blue")
            result = subprocess.run([sys.executable, "database_manager.py", "backup"], 
                                  cwd=Path(__file__).parent, capture_output=True, text=True)
            
            if result.returncode == 0:
                messagebox.showinfo("Backup", "Database backup created successfully!\n\nCheck the 'backups' folder.")
                self.status_label.config(text="✅ Backup created", foreground="green")
            else:
                messagebox.showerror("Backup Error", f"Backup failed:\n{result.stderr}")
                self.status_label.config(text="❌ Backup failed", foreground="red")
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to create backup:\n{str(e)}")
            self.status_label.config(text="❌ Backup failed", foreground="red")
    
    def open_cli_help(self):
        """Show CLI tools help"""
        help_text = """Database Management CLI Tools:

python database_manager.py health
  - Perform comprehensive database health check

python database_manager.py backup [--name BACKUP_NAME]
  - Create a full database backup

python database_manager.py list-backups
  - List all available backups

python database_manager.py validate
  - Validate data integrity

python database_manager.py cleanup [--days DAYS]
  - Clean old user interactions (default: 365 days)

python database_manager.py fix-stats
  - Create missing wallpaper stats records

python database_manager.py export [--format csv|json]
  - Export database data to files

Image Processing CLI:

python image_processor.py image1.jpg image2.jpg
  - Process images and generate all resolutions

python image_processor.py --preview image.jpg
  - Process image and generate HTML preview

python image_processor.py --clean 50
  - Keep only 50 most recent processed files"""
        
        # Create help window
        help_window = tk.Toplevel(self.root)
        help_window.title("CLI Tools Help")
        help_window.geometry("700x500")
        
        text_widget = tk.Text(help_window, wrap=tk.WORD, padx=20, pady=20)
        text_widget.pack(fill=tk.BOTH, expand=True)
        text_widget.insert(1.0, help_text)
        text_widget.config(state=tk.DISABLED)
        
        # Add scrollbar
        scrollbar = ttk.Scrollbar(help_window, command=text_widget.yview)
        text_widget.config(yscrollcommand=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
    
    def run(self):
        """Start the launcher"""
        self.root.mainloop()


if __name__ == "__main__":
    # Check if we're in the admin directory
    if not Path("image_processor.py").exists():
        print("❌ Please run this script from the admin directory")
        print("   cd admin && python launcher.py")
        sys.exit(1)
    
    launcher = AdminLauncher()
    launcher.run()