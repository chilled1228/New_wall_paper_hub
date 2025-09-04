#!/usr/bin/env python3
"""
Admin Dashboard - Complete management system for wallpaper website
Features:
- View and manage wallpapers with stats
- Bulk operations (delete, update categories, etc.)
- Analytics and performance metrics
- User interaction data
- Database maintenance tools
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog, scrolledtext
import os
import sys
from pathlib import Path
import threading
from typing import Dict, List, Optional
import json
from datetime import datetime, timedelta
import webbrowser
from collections import defaultdict

# Third-party imports
try:
    from dotenv import load_dotenv
    from supabase import create_client, Client
    from PIL import Image, ImageTk
    import matplotlib.pyplot as plt
    import matplotlib.dates as mdates
    from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
    import pandas as pd
except ImportError as e:
    print(f"Missing required package: {e}")
    print("Please install requirements: pip install -r requirements.txt")
    sys.exit(1)

class AdminDashboard:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Wallpaper Admin Dashboard")
        self.root.geometry("1400x900")
        self.root.resizable(True, True)
        
        # Load environment variables
        self.load_environment()
        
        # Initialize Supabase client
        self.supabase_client = None
        
        # Application state
        self.wallpapers_data = []
        self.stats_data = {}
        self.interactions_data = []
        self.selected_wallpapers = []
        
        # Setup UI
        self.setup_ui()
        
        # Initialize services
        self.initialize_services()
        
        # Load initial data
        self.load_dashboard_data()
    
    def load_environment(self):
        """Load environment variables"""
        env_path = Path(".env.local")
        if env_path.exists():
            load_dotenv(env_path)
        else:
            messagebox.showerror("Error", ".env.local file not found!")
            sys.exit(1)
    
    def initialize_services(self):
        """Initialize Supabase client"""
        try:
            supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
            supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
            self.supabase_client = create_client(supabase_url, supabase_key)
            self.update_status("Connected to database", "green")
        except Exception as e:
            self.update_status(f"Failed to connect: {str(e)}", "red")
            messagebox.showerror("Connection Error", f"Failed to connect to database: {str(e)}")
    
    def setup_ui(self):
        """Setup the admin dashboard UI"""
        # Create main notebook for tabs
        self.notebook = ttk.Notebook(self.root)
        self.notebook.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        # Create tabs
        self.setup_overview_tab()
        self.setup_wallpapers_tab()
        self.setup_analytics_tab()
        self.setup_maintenance_tab()
        
        # Status bar
        self.status_frame = ttk.Frame(self.root)
        self.status_frame.pack(fill=tk.X, padx=10, pady=(0, 10))
        
        self.status_label = ttk.Label(self.status_frame, text="Ready", foreground="green")
        self.status_label.pack(side=tk.LEFT)
        
        # Refresh button
        ttk.Button(self.status_frame, text="🔄 Refresh All", command=self.load_dashboard_data).pack(side=tk.RIGHT)
    
    def setup_overview_tab(self):
        """Setup overview/dashboard tab"""
        self.overview_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.overview_frame, text="📊 Overview")
        
        # Title
        title_label = ttk.Label(self.overview_frame, text="Wallpaper Website Dashboard", font=("Arial", 16, "bold"))
        title_label.pack(pady=(10, 20))
        
        # Stats cards frame
        stats_frame = ttk.Frame(self.overview_frame)
        stats_frame.pack(fill=tk.X, padx=20, pady=(0, 20))
        
        # Create stat cards
        self.stats_cards = {}
        stat_names = [
            ("Total Wallpapers", "wallpaper_count", "📷"),
            ("Total Downloads", "total_downloads", "⬇️"),
            ("Total Likes", "total_likes", "❤️"),
            ("Total Views", "total_views", "👁️")
        ]
        
        for i, (title, key, icon) in enumerate(stat_names):
            card_frame = ttk.LabelFrame(stats_frame, text=f"{icon} {title}", padding=15)
            card_frame.grid(row=0, column=i, padx=10, pady=10, sticky="ew")
            
            value_label = ttk.Label(card_frame, text="Loading...", font=("Arial", 20, "bold"))
            value_label.pack()
            
            self.stats_cards[key] = value_label
        
        # Configure grid weights
        for i in range(4):
            stats_frame.grid_columnconfigure(i, weight=1)
        
        # Recent activity frame
        activity_frame = ttk.LabelFrame(self.overview_frame, text="📈 Recent Activity", padding=15)
        activity_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=(0, 20))
        
        # Create treeview for recent activity
        columns = ("Time", "Action", "Wallpaper", "Details")
        self.activity_tree = ttk.Treeview(activity_frame, columns=columns, show="headings", height=10)
        
        for col in columns:
            self.activity_tree.heading(col, text=col)
            self.activity_tree.column(col, width=150)
        
        # Add scrollbar
        activity_scrollbar = ttk.Scrollbar(activity_frame, orient=tk.VERTICAL, command=self.activity_tree.yview)
        self.activity_tree.configure(yscrollcommand=activity_scrollbar.set)
        
        self.activity_tree.pack(side=tk.LEFT, fill=tk.BOTH, expand=True)
        activity_scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
        
        # Quick actions frame
        actions_frame = ttk.LabelFrame(self.overview_frame, text="⚡ Quick Actions", padding=15)
        actions_frame.pack(fill=tk.X, padx=20)
        
        ttk.Button(actions_frame, text="📂 Open Publisher", command=self.open_publisher).pack(side=tk.LEFT, padx=5)
        ttk.Button(actions_frame, text="📊 Export Data", command=self.export_data).pack(side=tk.LEFT, padx=5)
        ttk.Button(actions_frame, text="🧹 Cleanup", command=self.cleanup_database).pack(side=tk.LEFT, padx=5)
    
    def setup_wallpapers_tab(self):
        """Setup wallpapers management tab"""
        self.wallpapers_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.wallpapers_frame, text="🖼️ Wallpapers")
        
        # Search and filter frame
        search_frame = ttk.Frame(self.wallpapers_frame)
        search_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(search_frame, text="Search:").pack(side=tk.LEFT)
        self.search_var = tk.StringVar()
        self.search_entry = ttk.Entry(search_frame, textvariable=self.search_var, width=30)
        self.search_entry.pack(side=tk.LEFT, padx=5)
        self.search_entry.bind('<KeyRelease>', self.filter_wallpapers)
        
        ttk.Label(search_frame, text="Category:").pack(side=tk.LEFT, padx=(20, 5))
        self.filter_category = tk.StringVar()
        category_combo = ttk.Combobox(search_frame, textvariable=self.filter_category, 
                                    values=["All", "nature", "minimal", "abstract", "urban", "space", "art"])
        category_combo.pack(side=tk.LEFT, padx=5)
        category_combo.bind('<<ComboboxSelected>>', self.filter_wallpapers)
        category_combo.set("All")
        
        # Bulk actions frame
        bulk_frame = ttk.Frame(self.wallpapers_frame)
        bulk_frame.pack(fill=tk.X, padx=10, pady=5)
        
        ttk.Label(bulk_frame, text="Bulk Actions:").pack(side=tk.LEFT)
        ttk.Button(bulk_frame, text="Delete Selected", command=self.delete_selected_wallpapers).pack(side=tk.LEFT, padx=5)
        ttk.Button(bulk_frame, text="Change Category", command=self.change_category_bulk).pack(side=tk.LEFT, padx=5)
        ttk.Button(bulk_frame, text="Export Selected", command=self.export_selected).pack(side=tk.LEFT, padx=5)
        
        # Wallpapers list frame
        list_frame = ttk.Frame(self.wallpapers_frame)
        list_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Create treeview for wallpapers
        columns = ("ID", "Title", "Category", "Downloads", "Likes", "Views", "Created", "Status")
        self.wallpapers_tree = ttk.Treeview(list_frame, columns=columns, show="headings", height=20)
        
        # Configure columns
        column_configs = {
            "ID": 80,
            "Title": 200,
            "Category": 100,
            "Downloads": 80,
            "Likes": 80,
            "Views": 80,
            "Created": 100,
            "Status": 80
        }
        
        for col, width in column_configs.items():
            self.wallpapers_tree.heading(col, text=col)
            self.wallpapers_tree.column(col, width=width)
        
        # Add scrollbars
        v_scrollbar = ttk.Scrollbar(list_frame, orient=tk.VERTICAL, command=self.wallpapers_tree.yview)
        h_scrollbar = ttk.Scrollbar(list_frame, orient=tk.HORIZONTAL, command=self.wallpapers_tree.xview)
        self.wallpapers_tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Pack treeview and scrollbars
        self.wallpapers_tree.grid(row=0, column=0, sticky="nsew")
        v_scrollbar.grid(row=0, column=1, sticky="ns")
        h_scrollbar.grid(row=1, column=0, sticky="ew")
        
        list_frame.grid_rowconfigure(0, weight=1)
        list_frame.grid_columnconfigure(0, weight=1)
        
        # Bind events
        self.wallpapers_tree.bind('<Button-3>', self.show_wallpaper_context_menu)
        self.wallpapers_tree.bind('<Double-1>', self.view_wallpaper_details)
        
        # Details frame
        details_frame = ttk.LabelFrame(self.wallpapers_frame, text="📝 Wallpaper Details", padding=10)
        details_frame.pack(fill=tk.X, padx=10, pady=5)
        
        self.details_text = scrolledtext.ScrolledText(details_frame, height=6, state=tk.DISABLED)
        self.details_text.pack(fill=tk.BOTH, expand=True)
    
    def setup_analytics_tab(self):
        """Setup analytics tab"""
        self.analytics_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.analytics_frame, text="📈 Analytics")
        
        # Period selection
        period_frame = ttk.Frame(self.analytics_frame)
        period_frame.pack(fill=tk.X, padx=10, pady=10)
        
        ttk.Label(period_frame, text="Period:").pack(side=tk.LEFT)
        self.period_var = tk.StringVar()
        period_combo = ttk.Combobox(period_frame, textvariable=self.period_var,
                                  values=["Last 7 days", "Last 30 days", "Last 90 days", "All time"])
        period_combo.pack(side=tk.LEFT, padx=5)
        period_combo.set("Last 30 days")
        period_combo.bind('<<ComboboxSelected>>', self.update_analytics)
        
        ttk.Button(period_frame, text="📊 Generate Report", command=self.generate_analytics_report).pack(side=tk.RIGHT)
        
        # Analytics content frame
        self.analytics_content = ttk.Frame(self.analytics_frame)
        self.analytics_content.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Placeholder for charts
        self.charts_frame = ttk.Frame(self.analytics_content)
        self.charts_frame.pack(fill=tk.BOTH, expand=True)
        
        placeholder_label = ttk.Label(self.charts_frame, text="Analytics charts will appear here\nClick 'Generate Report' to load data")
        placeholder_label.pack(expand=True)
    
    def setup_maintenance_tab(self):
        """Setup maintenance tab"""
        self.maintenance_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.maintenance_frame, text="🔧 Maintenance")
        
        # Database info frame
        info_frame = ttk.LabelFrame(self.maintenance_frame, text="📊 Database Information", padding=15)
        info_frame.pack(fill=tk.X, padx=10, pady=10)
        
        self.db_info_text = scrolledtext.ScrolledText(info_frame, height=8, state=tk.DISABLED)
        self.db_info_text.pack(fill=tk.BOTH, expand=True)
        
        # Maintenance actions frame
        actions_frame = ttk.LabelFrame(self.maintenance_frame, text="🔧 Maintenance Actions", padding=15)
        actions_frame.pack(fill=tk.X, padx=10, pady=10)
        
        # Row 1
        row1 = ttk.Frame(actions_frame)
        row1.pack(fill=tk.X, pady=5)
        
        ttk.Button(row1, text="🔄 Refresh Database Stats", command=self.refresh_database_stats).pack(side=tk.LEFT, padx=5)
        ttk.Button(row1, text="🧹 Clean Old Interactions", command=self.clean_old_interactions).pack(side=tk.LEFT, padx=5)
        ttk.Button(row1, text="📊 Update Statistics", command=self.update_statistics).pack(side=tk.LEFT, padx=5)
        
        # Row 2
        row2 = ttk.Frame(actions_frame)
        row2.pack(fill=tk.X, pady=5)
        
        ttk.Button(row2, text="💾 Backup Database", command=self.backup_database).pack(side=tk.LEFT, padx=5)
        ttk.Button(row2, text="🔍 Validate Data", command=self.validate_data).pack(side=tk.LEFT, padx=5)
        ttk.Button(row2, text="🗑️ Remove Orphaned Files", command=self.remove_orphaned_files).pack(side=tk.LEFT, padx=5)
        
        # Logs frame
        logs_frame = ttk.LabelFrame(self.maintenance_frame, text="📝 Maintenance Logs", padding=15)
        logs_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        self.logs_text = scrolledtext.ScrolledText(logs_frame, height=12)
        self.logs_text.pack(fill=tk.BOTH, expand=True)
        
        # Log control frame
        log_control = ttk.Frame(logs_frame)
        log_control.pack(fill=tk.X, pady=(5, 0))
        
        ttk.Button(log_control, text="Clear Logs", command=self.clear_logs).pack(side=tk.LEFT)
        ttk.Button(log_control, text="Save Logs", command=self.save_logs).pack(side=tk.LEFT, padx=5)
    
    def update_status(self, message: str, color: str = "black"):
        """Update status bar"""
        self.status_label.config(text=f"{datetime.now().strftime('%H:%M:%S')} - {message}", foreground=color)
        self.root.update_idletasks()
    
    def log_message(self, message: str):
        """Add message to logs"""
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        log_entry = f"[{timestamp}] {message}\n"
        
        self.logs_text.config(state=tk.NORMAL)
        self.logs_text.insert(tk.END, log_entry)
        self.logs_text.see(tk.END)
        self.logs_text.config(state=tk.DISABLED)
    
    def load_dashboard_data(self):
        """Load all dashboard data"""
        threading.Thread(target=self._load_data_thread, daemon=True).start()
    
    def _load_data_thread(self):
        """Load data in separate thread"""
        try:
            self.root.after(0, lambda: self.update_status("Loading dashboard data...", "blue"))
            
            # Load wallpapers with stats
            wallpapers_result = self.supabase_client.table('wallpapers').select("""
                id, title, category, description, tags, image_url, thumbnail_url, medium_url, large_url, original_url, created_at
            """).execute()
            
            self.wallpapers_data = wallpapers_result.data
            
            # Load stats
            stats_result = self.supabase_client.table('wallpaper_stats').select('*').execute()
            stats_data = stats_result.data
            
            # Combine wallpapers with their stats
            stats_dict = {stat['wallpaper_id']: stat for stat in stats_data}
            
            for wallpaper in self.wallpapers_data:
                wallpaper_id = wallpaper['id']
                wallpaper['stats'] = stats_dict.get(wallpaper_id, {
                    'downloads': 0, 'likes': 0, 'views': 0
                })
            
            # Load recent interactions
            interactions_result = self.supabase_client.table('user_interactions').select("""
                created_at, interaction_type, wallpaper_id, wallpapers(title)
            """).order('created_at', desc=True).limit(50).execute()
            
            self.interactions_data = interactions_result.data
            
            # Update UI in main thread
            self.root.after(0, self._update_ui_with_data)
            
        except Exception as e:
            self.root.after(0, lambda: self.update_status(f"Error loading data: {str(e)}", "red"))
            self.root.after(0, lambda: self.log_message(f"ERROR: Failed to load data: {str(e)}"))
    
    def _update_ui_with_data(self):
        """Update UI with loaded data"""
        try:
            # Update overview stats
            total_wallpapers = len(self.wallpapers_data)
            total_downloads = sum(w['stats'].get('downloads', 0) for w in self.wallpapers_data)
            total_likes = sum(w['stats'].get('likes', 0) for w in self.wallpapers_data)
            total_views = sum(w['stats'].get('views', 0) for w in self.wallpapers_data)
            
            self.stats_cards['wallpaper_count'].config(text=f"{total_wallpapers:,}")
            self.stats_cards['total_downloads'].config(text=f"{total_downloads:,}")
            self.stats_cards['total_likes'].config(text=f"{total_likes:,}")
            self.stats_cards['total_views'].config(text=f"{total_views:,}")
            
            # Update wallpapers tree
            self.update_wallpapers_tree()
            
            # Update recent activity
            self.update_recent_activity()
            
            # Update database info
            self.update_database_info()
            
            self.update_status("Dashboard data loaded successfully", "green")
            self.log_message("Dashboard data refreshed successfully")
            
        except Exception as e:
            self.update_status(f"Error updating UI: {str(e)}", "red")
            self.log_message(f"ERROR: Failed to update UI: {str(e)}")
    
    def update_wallpapers_tree(self):
        """Update wallpapers treeview"""
        # Clear existing items
        for item in self.wallpapers_tree.get_children():
            self.wallpapers_tree.delete(item)
        
        # Add wallpapers
        for wallpaper in self.wallpapers_data:
            stats = wallpaper['stats']
            created_date = wallpaper.get('created_at', '')[:10] if wallpaper.get('created_at') else ''
            
            # Determine status based on image URLs
            status = "✅" if wallpaper.get('thumbnail_url') else "⚠️"
            
            values = (
                wallpaper['id'][-8:],  # Short ID
                wallpaper['title'][:30] + "..." if len(wallpaper['title']) > 30 else wallpaper['title'],
                wallpaper['category'],
                stats.get('downloads', 0),
                stats.get('likes', 0),
                stats.get('views', 0),
                created_date,
                status
            )
            
            self.wallpapers_tree.insert('', tk.END, values=values, tags=(wallpaper['id'],))
    
    def update_recent_activity(self):
        """Update recent activity tree"""
        # Clear existing items
        for item in self.activity_tree.get_children():
            self.activity_tree.delete(item)
        
        # Add recent interactions
        for interaction in self.interactions_data[:20]:  # Show last 20
            try:
                created_time = datetime.fromisoformat(interaction['created_at'].replace('Z', '+00:00'))
                time_str = created_time.strftime('%H:%M:%S')
                
                wallpaper_title = "Unknown"
                if interaction.get('wallpapers') and isinstance(interaction['wallpapers'], dict):
                    wallpaper_title = interaction['wallpapers'].get('title', 'Unknown')[:20]
                
                action_icons = {
                    'view': '👁️',
                    'like': '❤️',
                    'download': '⬇️'
                }
                
                action = f"{action_icons.get(interaction['interaction_type'], '❓')} {interaction['interaction_type'].title()}"
                
                values = (
                    time_str,
                    action,
                    wallpaper_title,
                    f"ID: {interaction['wallpaper_id'][-8:]}"
                )
                
                self.activity_tree.insert('', tk.END, values=values)
                
            except Exception as e:
                continue  # Skip malformed entries
    
    def update_database_info(self):
        """Update database information"""
        try:
            info_text = f"""Database Statistics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Table Counts:
   • Wallpapers: {len(self.wallpapers_data):,}
   • Interactions: {len(self.interactions_data):,}
   • Stats Records: {len([w for w in self.wallpapers_data if w['stats']])}

📈 Content Statistics:
   • Categories: {len(set(w['category'] for w in self.wallpapers_data))}
   • Total Tags: {sum(len(w.get('tags', [])) for w in self.wallpapers_data)}
   • With Thumbnails: {len([w for w in self.wallpapers_data if w.get('thumbnail_url')])}
   • With Full Resolution Set: {len([w for w in self.wallpapers_data if all(w.get(f'{res}_url') for res in ['thumbnail', 'medium', 'large', 'original'])])}

🔥 Top Performers:
   • Most Downloaded: {max((w['stats'].get('downloads', 0) for w in self.wallpapers_data), default=0):,}
   • Most Liked: {max((w['stats'].get('likes', 0) for w in self.wallpapers_data), default=0):,}
   • Most Viewed: {max((w['stats'].get('views', 0) for w in self.wallpapers_data), default=0):,}

📅 Recent Activity:
   • Last 24 hours: {len([i for i in self.interactions_data if (datetime.now() - datetime.fromisoformat(i['created_at'].replace('Z', '+00:00'))).days == 0])}
   • Last 7 days: {len([i for i in self.interactions_data if (datetime.now() - datetime.fromisoformat(i['created_at'].replace('Z', '+00:00'))).days <= 7])}

Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
"""
            
            self.db_info_text.config(state=tk.NORMAL)
            self.db_info_text.delete(1.0, tk.END)
            self.db_info_text.insert(1.0, info_text)
            self.db_info_text.config(state=tk.DISABLED)
            
        except Exception as e:
            self.log_message(f"ERROR: Failed to update database info: {str(e)}")
    
    # Event handlers and actions
    def filter_wallpapers(self, event=None):
        """Filter wallpapers based on search and category"""
        search_text = self.search_var.get().lower()
        category_filter = self.filter_category.get()
        
        # Clear current tree
        for item in self.wallpapers_tree.get_children():
            self.wallpapers_tree.delete(item)
        
        # Filter and display wallpapers
        for wallpaper in self.wallpapers_data:
            # Apply search filter
            if search_text and search_text not in wallpaper['title'].lower():
                continue
            
            # Apply category filter
            if category_filter != "All" and wallpaper['category'] != category_filter:
                continue
            
            # Add to tree
            stats = wallpaper['stats']
            created_date = wallpaper.get('created_at', '')[:10] if wallpaper.get('created_at') else ''
            status = "✅" if wallpaper.get('thumbnail_url') else "⚠️"
            
            values = (
                wallpaper['id'][-8:],
                wallpaper['title'][:30] + "..." if len(wallpaper['title']) > 30 else wallpaper['title'],
                wallpaper['category'],
                stats.get('downloads', 0),
                stats.get('likes', 0),
                stats.get('views', 0),
                created_date,
                status
            )
            
            self.wallpapers_tree.insert('', tk.END, values=values, tags=(wallpaper['id'],))
    
    def view_wallpaper_details(self, event):
        """Show detailed information about selected wallpaper"""
        selection = self.wallpapers_tree.selection()
        if not selection:
            return
        
        item = self.wallpapers_tree.item(selection[0])
        wallpaper_id = item['tags'][0]
        
        # Find wallpaper data
        wallpaper = next((w for w in self.wallpapers_data if w['id'] == wallpaper_id), None)
        if not wallpaper:
            return
        
        # Format details
        stats = wallpaper['stats']
        details = f"""Wallpaper Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📷 Basic Information:
   • ID: {wallpaper['id']}
   • Title: {wallpaper['title']}
   • Category: {wallpaper['category']}
   • Created: {wallpaper.get('created_at', 'Unknown')}

📊 Statistics:
   • Downloads: {stats.get('downloads', 0):,}
   • Likes: {stats.get('likes', 0):,}
   • Views: {stats.get('views', 0):,}

📝 Metadata:
   • Description: {wallpaper.get('description', 'No description')[:100]}...
   • Tags: {', '.join(wallpaper.get('tags', []))}

🖼️ Image URLs:
   • Thumbnail: {'✅' if wallpaper.get('thumbnail_url') else '❌'}
   • Medium: {'✅' if wallpaper.get('medium_url') else '❌'}
   • Large: {'✅' if wallpaper.get('large_url') else '❌'}
   • Original: {'✅' if wallpaper.get('original_url') else '❌'}
"""
        
        self.details_text.config(state=tk.NORMAL)
        self.details_text.delete(1.0, tk.END)
        self.details_text.insert(1.0, details)
        self.details_text.config(state=tk.DISABLED)
    
    def open_publisher(self):
        """Open wallpaper publisher"""
        try:
            import subprocess
            subprocess.Popen([sys.executable, "wallpaper_publisher_v2.py"])
            self.log_message("Opened wallpaper publisher")
        except Exception as e:
            self.log_message(f"ERROR: Failed to open publisher: {str(e)}")
            messagebox.showerror("Error", f"Failed to open publisher: {str(e)}")
    
    # Placeholder methods for additional functionality
    def delete_selected_wallpapers(self):
        messagebox.showinfo("Feature", "Bulk delete functionality coming soon!")
    
    def change_category_bulk(self):
        messagebox.showinfo("Feature", "Bulk category change coming soon!")
    
    def export_selected(self):
        messagebox.showinfo("Feature", "Export functionality coming soon!")
    
    def export_data(self):
        messagebox.showinfo("Feature", "Data export functionality coming soon!")
    
    def cleanup_database(self):
        messagebox.showinfo("Feature", "Database cleanup coming soon!")
    
    def update_analytics(self, event=None):
        messagebox.showinfo("Feature", "Analytics update coming soon!")
    
    def generate_analytics_report(self):
        messagebox.showinfo("Feature", "Analytics report generation coming soon!")
    
    def show_wallpaper_context_menu(self, event):
        messagebox.showinfo("Feature", "Context menu coming soon!")
    
    def refresh_database_stats(self):
        self.load_dashboard_data()
    
    def clean_old_interactions(self):
        messagebox.showinfo("Feature", "Interaction cleanup coming soon!")
    
    def update_statistics(self):
        messagebox.showinfo("Feature", "Statistics update coming soon!")
    
    def backup_database(self):
        messagebox.showinfo("Feature", "Database backup coming soon!")
    
    def validate_data(self):
        messagebox.showinfo("Feature", "Data validation coming soon!")
    
    def remove_orphaned_files(self):
        messagebox.showinfo("Feature", "Orphaned file cleanup coming soon!")
    
    def clear_logs(self):
        self.logs_text.config(state=tk.NORMAL)
        self.logs_text.delete(1.0, tk.END)
        self.logs_text.config(state=tk.DISABLED)
    
    def save_logs(self):
        try:
            filename = filedialog.asksaveasfilename(
                defaultextension=".txt",
                filetypes=[("Text files", "*.txt"), ("All files", "*.*")]
            )
            if filename:
                with open(filename, 'w') as f:
                    f.write(self.logs_text.get(1.0, tk.END))
                messagebox.showinfo("Success", f"Logs saved to {filename}")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save logs: {str(e)}")
    
    def run(self):
        """Start the dashboard"""
        self.root.mainloop()


if __name__ == "__main__":
    dashboard = AdminDashboard()
    dashboard.run()