#!/usr/bin/env python3
"""
Wallpaper Manager - Complete wallpaper management interface
Features:
- View, edit, delete wallpapers
- Bulk operations (delete, category change, export)
- File cleanup (delete from storage)
- Search and filtering
- Detailed wallpaper editor
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog, scrolledtext, simpledialog
import os
import sys
from pathlib import Path
import threading
from typing import Dict, List, Optional
import json
from datetime import datetime
import webbrowser
import requests
from urllib.parse import urlparse

# Third-party imports
try:
    from dotenv import load_dotenv
    from supabase import create_client, Client
    from PIL import Image, ImageTk
    import boto3
    from botocore.exceptions import ClientError
except ImportError as e:
    print(f"Missing required package: {e}")
    print("Please install requirements: pip install -r requirements.txt")
    sys.exit(1)

class WallpaperEditDialog:
    """Dialog for editing wallpaper details"""
    
    def __init__(self, parent, wallpaper_data, supabase_client):
        self.parent = parent
        self.wallpaper_data = wallpaper_data.copy()
        self.supabase_client = supabase_client
        self.result = None
        
        # Create dialog window
        self.dialog = tk.Toplevel(parent)
        self.dialog.title(f"Edit Wallpaper - {wallpaper_data['title']}")
        self.dialog.geometry("600x700")
        self.dialog.resizable(True, True)
        self.dialog.transient(parent)
        self.dialog.grab_set()
        
        self.setup_ui()
        
        # Center dialog on parent
        self.center_dialog()
    
    def center_dialog(self):
        """Center dialog on parent window"""
        self.dialog.update_idletasks()
        parent_x = self.parent.winfo_rootx()
        parent_y = self.parent.winfo_rooty()
        parent_width = self.parent.winfo_width()
        parent_height = self.parent.winfo_height()
        
        dialog_width = self.dialog.winfo_width()
        dialog_height = self.dialog.winfo_height()
        
        x = parent_x + (parent_width - dialog_width) // 2
        y = parent_y + (parent_height - dialog_height) // 2
        
        self.dialog.geometry(f"+{x}+{y}")
    
    def setup_ui(self):
        """Setup the edit dialog UI"""
        main_frame = ttk.Frame(self.dialog)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Title
        title_label = ttk.Label(main_frame, text="Edit Wallpaper", font=("Arial", 16, "bold"))
        title_label.pack(pady=(0, 20))
        
        # Basic info frame
        info_frame = ttk.LabelFrame(main_frame, text="Basic Information", padding=15)
        info_frame.pack(fill=tk.X, pady=(0, 15))
        
        # Title field
        ttk.Label(info_frame, text="Title:").pack(anchor=tk.W)
        self.title_var = tk.StringVar(value=self.wallpaper_data.get('title', ''))
        self.title_entry = ttk.Entry(info_frame, textvariable=self.title_var, font=("Arial", 10))
        self.title_entry.pack(fill=tk.X, pady=(0, 10))
        
        # Category field
        ttk.Label(info_frame, text="Category:").pack(anchor=tk.W)
        self.category_var = tk.StringVar(value=self.wallpaper_data.get('category', ''))
        self.category_combo = ttk.Combobox(info_frame, textvariable=self.category_var,
                                         values=["nature", "minimal", "abstract", "urban", "space", "art"])
        self.category_combo.pack(fill=tk.X, pady=(0, 10))
        
        # Tags field
        ttk.Label(info_frame, text="Tags (comma-separated):").pack(anchor=tk.W)
        tags_str = ', '.join(self.wallpaper_data.get('tags', []))
        self.tags_var = tk.StringVar(value=tags_str)
        self.tags_entry = ttk.Entry(info_frame, textvariable=self.tags_var, font=("Arial", 10))
        self.tags_entry.pack(fill=tk.X, pady=(0, 10))
        
        # Description field
        ttk.Label(info_frame, text="Description:").pack(anchor=tk.W)
        self.description_text = scrolledtext.ScrolledText(info_frame, height=4, font=("Arial", 10))
        self.description_text.pack(fill=tk.X, pady=(0, 10))
        self.description_text.insert(1.0, self.wallpaper_data.get('description', ''))
        
        # Image URLs frame
        urls_frame = ttk.LabelFrame(main_frame, text="Image URLs", padding=15)
        urls_frame.pack(fill=tk.X, pady=(0, 15))
        
        # URL fields
        url_fields = [
            ('Thumbnail URL:', 'thumbnail_url'),
            ('Medium URL:', 'medium_url'),
            ('Large URL:', 'large_url'),
            ('Original URL:', 'original_url')
        ]
        
        self.url_vars = {}
        for label, field in url_fields:
            ttk.Label(urls_frame, text=label).pack(anchor=tk.W)
            var = tk.StringVar(value=self.wallpaper_data.get(field, ''))
            entry = ttk.Entry(urls_frame, textvariable=var, font=("Arial", 9))
            entry.pack(fill=tk.X, pady=(0, 8))
            self.url_vars[field] = var
        
        # Stats info frame (read-only)
        stats_frame = ttk.LabelFrame(main_frame, text="Statistics (Read-only)", padding=15)
        stats_frame.pack(fill=tk.X, pady=(0, 15))
        
        stats = self.wallpaper_data.get('stats', {})
        stats_text = f"""Downloads: {stats.get('downloads', 0):,}
Likes: {stats.get('likes', 0):,}
Views: {stats.get('views', 0):,}
Created: {self.wallpaper_data.get('created_at', 'Unknown')}
ID: {self.wallpaper_data.get('id', 'Unknown')}"""
        
        stats_label = ttk.Label(stats_frame, text=stats_text, font=("Arial", 9))
        stats_label.pack(anchor=tk.W)
        
        # Buttons frame
        buttons_frame = ttk.Frame(main_frame)
        buttons_frame.pack(fill=tk.X, pady=(20, 0))
        
        ttk.Button(buttons_frame, text="Cancel", command=self.cancel).pack(side=tk.RIGHT, padx=(10, 0))
        ttk.Button(buttons_frame, text="Save Changes", command=self.save_changes).pack(side=tk.RIGHT)
        ttk.Button(buttons_frame, text="Preview URLs", command=self.preview_urls).pack(side=tk.LEFT)
    
    def preview_urls(self):
        """Preview image URLs in browser"""
        urls = {
            'Thumbnail': self.url_vars['thumbnail_url'].get(),
            'Medium': self.url_vars['medium_url'].get(),
            'Large': self.url_vars['large_url'].get(),
            'Original': self.url_vars['original_url'].get()
        }
        
        preview_window = tk.Toplevel(self.dialog)
        preview_window.title("URL Preview")
        preview_window.geometry("500x400")
        
        text_widget = scrolledtext.ScrolledText(preview_window, wrap=tk.WORD)
        text_widget.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)
        
        for name, url in urls.items():
            if url:
                text_widget.insert(tk.END, f"{name}: {url}\n\n")
        
        # Add buttons to open URLs
        button_frame = ttk.Frame(preview_window)
        button_frame.pack(fill=tk.X, padx=10, pady=(0, 10))
        
        for name, url in urls.items():
            if url:
                ttk.Button(button_frame, text=f"Open {name}", 
                          command=lambda u=url: webbrowser.open(u)).pack(side=tk.LEFT, padx=5)
    
    def save_changes(self):
        """Save changes to database"""
        try:
            # Validate required fields
            if not self.title_var.get().strip():
                messagebox.showerror("Validation Error", "Title is required")
                return
            
            if not self.category_var.get().strip():
                messagebox.showerror("Validation Error", "Category is required")
                return
            
            # Prepare update data
            tags = [tag.strip() for tag in self.tags_var.get().split(',') if tag.strip()]
            
            update_data = {
                'title': self.title_var.get().strip(),
                'category': self.category_var.get().strip(),
                'tags': tags,
                'description': self.description_text.get(1.0, tk.END).strip(),
                'thumbnail_url': self.url_vars['thumbnail_url'].get().strip() or None,
                'medium_url': self.url_vars['medium_url'].get().strip() or None,
                'large_url': self.url_vars['large_url'].get().strip() or None,
                'original_url': self.url_vars['original_url'].get().strip() or None
            }
            
            # Update main image_url to original_url if available, otherwise use any available URL
            main_url = (update_data['original_url'] or 
                       update_data['large_url'] or 
                       update_data['medium_url'] or 
                       update_data['thumbnail_url'])
            
            if main_url:
                update_data['image_url'] = main_url
            
            # Update in database
            result = self.supabase_client.table('wallpapers').update(update_data).eq('id', self.wallpaper_data['id']).execute()
            
            if result.data:
                self.result = result.data[0]
                messagebox.showinfo("Success", "Wallpaper updated successfully!")
                self.dialog.destroy()
            else:
                messagebox.showerror("Error", "Failed to update wallpaper")
                
        except Exception as e:
            messagebox.showerror("Error", f"Failed to save changes: {str(e)}")
    
    def cancel(self):
        """Cancel editing"""
        self.dialog.destroy()

class WallpaperManager:
    """Main wallpaper management interface"""
    
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Wallpaper Manager - Delete, Edit & Manage")
        self.root.geometry("1500x900")
        self.root.resizable(True, True)
        
        # Load environment
        self.load_environment()
        
        # Initialize clients
        self.supabase_client = None
        self.r2_client = None
        
        # Application state
        self.wallpapers_data = []
        self.selected_items = []
        self.filtered_data = []
        
        # Setup UI
        self.setup_ui()
        
        # Initialize services
        self.initialize_services()
        
        # Load data
        self.load_wallpapers()
    
    def load_environment(self):
        """Load environment variables"""
        env_path = Path("../.env.local")  # Parent directory
        if not env_path.exists():
            env_path = Path(".env.local")  # Current directory
        
        if env_path.exists():
            load_dotenv(env_path)
        else:
            messagebox.showerror("Error", ".env.local file not found!")
            sys.exit(1)
    
    def initialize_services(self):
        """Initialize services"""
        try:
            # Supabase
            supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
            supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
            self.supabase_client = create_client(supabase_url, supabase_key)
            
            # R2 (for file deletion)
            self.r2_client = boto3.client(
                's3',
                endpoint_url=f"https://{os.getenv('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com",
                aws_access_key_id=os.getenv('R2_ACCESS_KEY_ID'),
                aws_secret_access_key=os.getenv('R2_SECRET_ACCESS_KEY'),
                region_name='auto'
            )
            
            self.update_status("✅ Connected to services", "green")
            
        except Exception as e:
            self.update_status(f"❌ Connection failed: {str(e)}", "red")
            messagebox.showerror("Connection Error", f"Failed to connect: {str(e)}")
    
    def setup_ui(self):
        """Setup the UI"""
        # Title frame
        title_frame = ttk.Frame(self.root)
        title_frame.pack(fill=tk.X, padx=10, pady=10)
        
        title_label = ttk.Label(title_frame, text="🖼️ Wallpaper Manager", font=("Arial", 18, "bold"))
        title_label.pack(side=tk.LEFT)
        
        # Action buttons on the right
        ttk.Button(title_frame, text="🔄 Refresh", command=self.load_wallpapers).pack(side=tk.RIGHT, padx=5)
        ttk.Button(title_frame, text="📊 Dashboard", command=self.open_dashboard).pack(side=tk.RIGHT, padx=5)
        
        # Search and filter frame
        search_frame = ttk.Frame(self.root)
        search_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Search
        ttk.Label(search_frame, text="🔍 Search:").pack(side=tk.LEFT)
        self.search_var = tk.StringVar()
        self.search_entry = ttk.Entry(search_frame, textvariable=self.search_var, width=30)
        self.search_entry.pack(side=tk.LEFT, padx=5)
        self.search_entry.bind('<KeyRelease>', self.apply_filters)
        
        # Category filter
        ttk.Label(search_frame, text="📂 Category:").pack(side=tk.LEFT, padx=(20, 5))
        self.category_filter = tk.StringVar()
        category_combo = ttk.Combobox(search_frame, textvariable=self.category_filter, width=15,
                                    values=["All", "nature", "minimal", "abstract", "urban", "space", "art"])
        category_combo.pack(side=tk.LEFT, padx=5)
        category_combo.set("All")
        category_combo.bind('<<ComboboxSelected>>', self.apply_filters)
        
        # Status filter
        ttk.Label(search_frame, text="📊 Status:").pack(side=tk.LEFT, padx=(20, 5))
        self.status_filter = tk.StringVar()
        status_combo = ttk.Combobox(search_frame, textvariable=self.status_filter, width=15,
                                  values=["All", "Complete", "Missing URLs", "No Stats"])
        status_combo.pack(side=tk.LEFT, padx=5)
        status_combo.set("All")
        status_combo.bind('<<ComboboxSelected>>', self.apply_filters)
        
        # Clear filters
        ttk.Button(search_frame, text="🧹 Clear", command=self.clear_filters).pack(side=tk.RIGHT)
        
        # Selection and bulk actions frame
        selection_frame = ttk.Frame(self.root)
        selection_frame.pack(fill=tk.X, padx=10, pady=5)
        
        # Selection info
        self.selection_label = ttk.Label(selection_frame, text="No items selected")
        self.selection_label.pack(side=tk.LEFT)
        
        # Bulk action buttons
        bulk_frame = ttk.Frame(selection_frame)
        bulk_frame.pack(side=tk.RIGHT)
        
        ttk.Button(bulk_frame, text="☑️ Select All", command=self.select_all).pack(side=tk.LEFT, padx=2)
        ttk.Button(bulk_frame, text="☐ Select None", command=self.select_none).pack(side=tk.LEFT, padx=2)
        ttk.Button(bulk_frame, text="🗑️ Delete Selected", command=self.delete_selected, 
                  style="Danger.TButton").pack(side=tk.LEFT, padx=2)
        ttk.Button(bulk_frame, text="📂 Change Category", command=self.change_category_bulk).pack(side=tk.LEFT, padx=2)
        ttk.Button(bulk_frame, text="💾 Export Selected", command=self.export_selected).pack(side=tk.LEFT, padx=2)
        
        # Main content frame
        content_frame = ttk.Frame(self.root)
        content_frame.pack(fill=tk.BOTH, expand=True, padx=10, pady=5)
        
        # Wallpapers treeview
        columns = ("Select", "ID", "Title", "Category", "Stats", "Status", "Created", "Actions")
        self.tree = ttk.Treeview(content_frame, columns=columns, show="headings", height=20)
        
        # Configure columns
        column_configs = {
            "Select": (50, tk.CENTER),
            "ID": (80, tk.CENTER),
            "Title": (250, tk.W),
            "Category": (100, tk.CENTER),
            "Stats": (120, tk.CENTER),
            "Status": (100, tk.CENTER),
            "Created": (100, tk.CENTER),
            "Actions": (150, tk.CENTER)
        }
        
        for col, (width, anchor) in column_configs.items():
            self.tree.heading(col, text=col)
            self.tree.column(col, width=width, anchor=anchor)
        
        # Scrollbars
        v_scrollbar = ttk.Scrollbar(content_frame, orient=tk.VERTICAL, command=self.tree.yview)
        h_scrollbar = ttk.Scrollbar(content_frame, orient=tk.HORIZONTAL, command=self.tree.xview)
        self.tree.configure(yscrollcommand=v_scrollbar.set, xscrollcommand=h_scrollbar.set)
        
        # Grid layout
        self.tree.grid(row=0, column=0, sticky="nsew")
        v_scrollbar.grid(row=0, column=1, sticky="ns")
        h_scrollbar.grid(row=1, column=0, sticky="ew")
        
        content_frame.grid_rowconfigure(0, weight=1)
        content_frame.grid_columnconfigure(0, weight=1)
        
        # Bind events
        self.tree.bind('<Button-1>', self.on_tree_click)
        self.tree.bind('<Double-1>', self.edit_wallpaper)
        self.tree.bind('<Button-3>', self.show_context_menu)
        
        # Status bar
        self.status_frame = ttk.Frame(self.root)
        self.status_frame.pack(fill=tk.X, padx=10, pady=5)
        
        self.status_label = ttk.Label(self.status_frame, text="Ready")
        self.status_label.pack(side=tk.LEFT)
        
        self.progress_bar = ttk.Progressbar(self.status_frame, mode='indeterminate')
        self.progress_bar.pack(side=tk.RIGHT, padx=(10, 0))
    
    def update_status(self, message: str, color: str = "black"):
        """Update status bar"""
        self.status_label.config(text=f"{datetime.now().strftime('%H:%M:%S')} - {message}", foreground=color)
        self.root.update_idletasks()
    
    def load_wallpapers(self):
        """Load wallpapers from database"""
        threading.Thread(target=self._load_wallpapers_thread, daemon=True).start()
    
    def _load_wallpapers_thread(self):
        """Load wallpapers in separate thread"""
        try:
            self.root.after(0, lambda: self.progress_bar.start())
            self.root.after(0, lambda: self.update_status("Loading wallpapers...", "blue"))
            
            # Load wallpapers - try different approaches to get all records
            try:
                # Method 1: Try with explicit limit
                wallpapers_result = self.supabase_client.table('wallpapers').select('*').order('created_at', desc=True).limit(1000).execute()
                wallpapers = wallpapers_result.data or []
            except Exception as e:
                print(f"DEBUG: Method 1 failed: {e}")
                try:
                    # Method 2: Try without limit
                    wallpapers_result = self.supabase_client.table('wallpapers').select('*').order('created_at', desc=True).execute()
                    wallpapers = wallpapers_result.data or []
                except Exception as e:
                    print(f"DEBUG: Method 2 failed: {e}")
                    # Method 3: Basic select
                    wallpapers_result = self.supabase_client.table('wallpapers').select('*').execute()
                    wallpapers = wallpapers_result.data or []
            
            # Debug: Print what we got
            print(f"DEBUG: Loaded {len(wallpapers)} wallpapers from database")
            if wallpapers:
                print(f"DEBUG: First wallpaper: {wallpapers[0].get('id', 'NO_ID')} - {wallpapers[0].get('title', 'NO_TITLE')}")
                print(f"DEBUG: Last wallpaper: {wallpapers[-1].get('id', 'NO_ID')} - {wallpapers[-1].get('title', 'NO_TITLE')}")
            
            # Load stats
            try:
                stats_result = self.supabase_client.table('wallpaper_stats').select('*').execute()
                stats_data = stats_result.data or []
            except Exception as e:
                print(f"DEBUG: Stats loading failed: {e}")
                stats_data = []
            
            # Debug: Print stats info
            print(f"DEBUG: Loaded {len(stats_data)} stats records")
            
            # Create stats lookup
            stats_dict = {stat['wallpaper_id']: stat for stat in stats_data}
            
            # Combine data
            for wallpaper in wallpapers:
                wallpaper['stats'] = stats_dict.get(wallpaper['id'], {
                    'downloads': 0, 'likes': 0, 'views': 0
                })
            
            self.wallpapers_data = wallpapers
            
            self.root.after(0, self._update_tree_display)
            self.root.after(0, lambda: self.update_status(f"✅ Loaded {len(wallpapers)} wallpapers", "green"))
            
        except Exception as e:
            self.root.after(0, lambda: self.update_status(f"❌ Load failed: {str(e)}", "red"))
        finally:
            self.root.after(0, lambda: self.progress_bar.stop())
    
    def _update_tree_display(self):
        """Update treeview with wallpaper data"""
        # Clear existing items
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        self.filtered_data = self.wallpapers_data.copy()
        self.apply_filters()
    
    def apply_filters(self, event=None):
        """Apply search and category filters"""
        search_text = self.search_var.get().lower()
        category_filter = self.category_filter.get()
        status_filter = self.status_filter.get()
        
        # Clear tree
        for item in self.tree.get_children():
            self.tree.delete(item)
        
        # Filter data
        filtered_wallpapers = []
        for wallpaper in self.wallpapers_data:
            # Search filter
            if search_text and search_text not in wallpaper.get('title', '').lower():
                continue
            
            # Category filter
            if category_filter != "All" and wallpaper.get('category') != category_filter:
                continue
            
            # Status filter
            if status_filter != "All":
                has_all_urls = all(wallpaper.get(f'{res}_url') for res in ['thumbnail', 'medium', 'large', 'original'])
                has_stats = wallpaper.get('stats', {}).get('views', 0) > 0
                
                if status_filter == "Complete" and not has_all_urls:
                    continue
                elif status_filter == "Missing URLs" and has_all_urls:
                    continue
                elif status_filter == "No Stats" and has_stats:
                    continue
            
            filtered_wallpapers.append(wallpaper)
        
        self.filtered_data = filtered_wallpapers
        
        # Add to tree
        print(f"DEBUG: Adding {len(filtered_wallpapers)} wallpapers to tree")
        for i, wallpaper in enumerate(filtered_wallpapers):
            self._add_wallpaper_to_tree(wallpaper)
            if i < 3:  # Debug first 3
                print(f"DEBUG: Added wallpaper {i+1}: {wallpaper.get('title', 'NO_TITLE')}")
        
        # Update selection count
        self.update_selection_count()
    
    def _add_wallpaper_to_tree(self, wallpaper):
        """Add wallpaper to treeview"""
        stats = wallpaper.get('stats', {})
        stats_text = f"D:{stats.get('downloads', 0)} L:{stats.get('likes', 0)} V:{stats.get('views', 0)}"
        
        # Determine status
        has_all_urls = all(wallpaper.get(f'{res}_url') for res in ['thumbnail', 'medium', 'large', 'original'])
        if has_all_urls:
            status = "✅ Complete"
        elif any(wallpaper.get(f'{res}_url') for res in ['thumbnail', 'medium', 'large', 'original']):
            status = "⚠️ Partial"
        else:
            status = "❌ Missing"
        
        created_date = wallpaper.get('created_at', '')[:10] if wallpaper.get('created_at') else ''
        
        values = (
            "☐",  # Select checkbox
            wallpaper['id'][-8:],  # Short ID
            wallpaper.get('title', 'No Title')[:40] + ("..." if len(wallpaper.get('title', '')) > 40 else ""),
            wallpaper.get('category', 'Unknown'),
            stats_text,
            status,
            created_date,
            "Edit | Delete"
        )
        
        item_id = self.tree.insert('', tk.END, values=values, tags=(wallpaper['id'],))
    
    def on_tree_click(self, event):
        """Handle tree click events"""
        region = self.tree.identify_region(event.x, event.y)
        if region == "cell":
            column = self.tree.identify_column(event.x)
            item = self.tree.identify_row(event.y)
            
            if column == "#1" and item:  # Select column
                self.toggle_selection(item)
            elif column == "#8" and item:  # Actions column
                self.show_action_menu(event, item)
    
    def toggle_selection(self, item):
        """Toggle item selection"""
        current_values = list(self.tree.item(item)['values'])
        wallpaper_id = self.tree.item(item)['tags'][0]
        
        if current_values[0] == "☐":
            current_values[0] = "☑"
            self.selected_items.append(wallpaper_id)
        else:
            current_values[0] = "☐"
            if wallpaper_id in self.selected_items:
                self.selected_items.remove(wallpaper_id)
        
        self.tree.item(item, values=current_values)
        self.update_selection_count()
    
    def update_selection_count(self):
        """Update selection count label"""
        count = len(self.selected_items)
        total = len(self.filtered_data)
        self.selection_label.config(text=f"Selected: {count} / {total} wallpapers")
    
    def select_all(self):
        """Select all visible items"""
        self.selected_items.clear()
        for item in self.tree.get_children():
            wallpaper_id = self.tree.item(item)['tags'][0]
            self.selected_items.append(wallpaper_id)
            
            values = list(self.tree.item(item)['values'])
            values[0] = "☑"
            self.tree.item(item, values=values)
        
        self.update_selection_count()
    
    def select_none(self):
        """Deselect all items"""
        self.selected_items.clear()
        for item in self.tree.get_children():
            values = list(self.tree.item(item)['values'])
            values[0] = "☐"
            self.tree.item(item, values=values)
        
        self.update_selection_count()
    
    def clear_filters(self):
        """Clear all filters"""
        self.search_var.set("")
        self.category_filter.set("All")
        self.status_filter.set("All")
        self.apply_filters()
    
    def edit_wallpaper(self, event):
        """Edit selected wallpaper"""
        selection = self.tree.selection()
        if not selection:
            return
        
        item = selection[0]
        wallpaper_id = self.tree.item(item)['tags'][0]
        wallpaper_data = next((w for w in self.wallpapers_data if w['id'] == wallpaper_id), None)
        
        if wallpaper_data:
            # Open edit dialog
            dialog = WallpaperEditDialog(self.root, wallpaper_data, self.supabase_client)
            self.root.wait_window(dialog.dialog)
            
            # Refresh if changes were made
            if dialog.result:
                self.load_wallpapers()
    
    def show_action_menu(self, event, item):
        """Show action context menu"""
        wallpaper_id = self.tree.item(item)['tags'][0]
        wallpaper_data = next((w for w in self.wallpapers_data if w['id'] == wallpaper_id), None)
        
        if not wallpaper_data:
            return
        
        # Create context menu
        menu = tk.Menu(self.root, tearoff=0)
        menu.add_command(label="✏️ Edit", command=lambda: self.edit_single_wallpaper(wallpaper_data))
        menu.add_command(label="👁️ View Details", command=lambda: self.view_wallpaper_details(wallpaper_data))
        menu.add_command(label="🌐 View URLs", command=lambda: self.view_wallpaper_urls(wallpaper_data))
        menu.add_separator()
        menu.add_command(label="🗑️ Delete", command=lambda: self.delete_single_wallpaper(wallpaper_data))
        
        menu.post(event.x_root, event.y_root)
    
    def show_context_menu(self, event):
        """Show general context menu"""
        item = self.tree.identify_row(event.y)
        if item:
            self.tree.selection_set(item)
            self.show_action_menu(event, item)
    
    def edit_single_wallpaper(self, wallpaper_data):
        """Edit a single wallpaper"""
        dialog = WallpaperEditDialog(self.root, wallpaper_data, self.supabase_client)
        self.root.wait_window(dialog.dialog)
        
        if dialog.result:
            self.load_wallpapers()
    
    def view_wallpaper_details(self, wallpaper_data):
        """View detailed wallpaper information"""
        details_window = tk.Toplevel(self.root)
        details_window.title(f"Wallpaper Details - {wallpaper_data['title']}")
        details_window.geometry("600x500")
        
        text_widget = scrolledtext.ScrolledText(details_window, wrap=tk.WORD, padx=20, pady=20)
        text_widget.pack(fill=tk.BOTH, expand=True)
        
        stats = wallpaper_data.get('stats', {})
        details_text = f"""📷 WALLPAPER DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🆔 ID: {wallpaper_data['id']}
📝 Title: {wallpaper_data.get('title', 'No Title')}
📂 Category: {wallpaper_data.get('category', 'Unknown')}
🏷️ Tags: {', '.join(wallpaper_data.get('tags', []))}
📅 Created: {wallpaper_data.get('created_at', 'Unknown')}

📊 STATISTICS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⬇️ Downloads: {stats.get('downloads', 0):,}
❤️ Likes: {stats.get('likes', 0):,}
👁️ Views: {stats.get('views', 0):,}

📄 DESCRIPTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{wallpaper_data.get('description', 'No description available')}

🔗 IMAGE URLS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📷 Main URL: {wallpaper_data.get('image_url', 'Not set')}
🖼️ Thumbnail: {wallpaper_data.get('thumbnail_url', 'Not set')}
📱 Medium: {wallpaper_data.get('medium_url', 'Not set')}
🖥️ Large: {wallpaper_data.get('large_url', 'Not set')}
🎯 Original: {wallpaper_data.get('original_url', 'Not set')}
"""
        
        text_widget.insert(1.0, details_text)
        text_widget.config(state=tk.DISABLED)
    
    def view_wallpaper_urls(self, wallpaper_data):
        """View and test wallpaper URLs"""
        urls_window = tk.Toplevel(self.root)
        urls_window.title(f"Image URLs - {wallpaper_data['title']}")
        urls_window.geometry("800x400")
        
        main_frame = ttk.Frame(urls_window)
        main_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        ttk.Label(main_frame, text="🔗 Image URLs", font=("Arial", 14, "bold")).pack(pady=(0, 20))
        
        urls = [
            ("Thumbnail (150×200)", wallpaper_data.get('thumbnail_url')),
            ("Medium (400×533)", wallpaper_data.get('medium_url')),
            ("Large (800×1067)", wallpaper_data.get('large_url')),
            ("Original (Full Size)", wallpaper_data.get('original_url')),
            ("Main URL", wallpaper_data.get('image_url'))
        ]
        
        for name, url in urls:
            if url:
                url_frame = ttk.Frame(main_frame)
                url_frame.pack(fill=tk.X, pady=5)
                
                ttk.Label(url_frame, text=f"{name}:", width=20, font=("Arial", 9, "bold")).pack(side=tk.LEFT)
                url_label = ttk.Label(url_frame, text=url, foreground="blue", cursor="hand2")
                url_label.pack(side=tk.LEFT, fill=tk.X, expand=True, padx=(10, 0))
                url_label.bind("<Button-1>", lambda e, u=url: webbrowser.open(u))
                
                ttk.Button(url_frame, text="Open", command=lambda u=url: webbrowser.open(u), width=8).pack(side=tk.RIGHT)
            else:
                url_frame = ttk.Frame(main_frame)
                url_frame.pack(fill=tk.X, pady=5)
                
                ttk.Label(url_frame, text=f"{name}:", width=20, font=("Arial", 9, "bold")).pack(side=tk.LEFT)
                ttk.Label(url_frame, text="❌ Not available", foreground="red").pack(side=tk.LEFT, padx=(10, 0))
    
    def delete_single_wallpaper(self, wallpaper_data):
        """Delete a single wallpaper"""
        if messagebox.askyesno("Confirm Deletion", 
                              f"Are you sure you want to delete:\n\n'{wallpaper_data['title']}'\n\nThis will also delete the image files from storage."):
            self.delete_wallpapers([wallpaper_data])
    
    def delete_selected(self):
        """Delete selected wallpapers"""
        if not self.selected_items:
            messagebox.showwarning("No Selection", "Please select wallpapers to delete")
            return
        
        count = len(self.selected_items)
        if messagebox.askyesno("Confirm Bulk Deletion", 
                              f"Are you sure you want to delete {count} wallpapers?\n\nThis will also delete all image files from storage.\n\nThis action cannot be undone!"):
            
            # Get wallpaper data for selected items
            wallpapers_to_delete = [w for w in self.wallpapers_data if w['id'] in self.selected_items]
            self.delete_wallpapers(wallpapers_to_delete)
    
    def delete_wallpapers(self, wallpapers_to_delete):
        """Delete wallpapers from database and storage"""
        threading.Thread(target=self._delete_wallpapers_thread, args=(wallpapers_to_delete,), daemon=True).start()
    
    def _delete_wallpapers_thread(self, wallpapers_to_delete):
        """Delete wallpapers in separate thread"""
        try:
            self.root.after(0, lambda: self.progress_bar.start())
            self.root.after(0, lambda: self.update_status(f"Deleting {len(wallpapers_to_delete)} wallpapers...", "blue"))
            
            deleted_count = 0
            errors = []
            
            for wallpaper in wallpapers_to_delete:
                try:
                    wallpaper_id = wallpaper['id']
                    title = wallpaper.get('title', 'Unknown')
                    
                    self.root.after(0, lambda t=title: self.update_status(f"Deleting: {t}", "blue"))
                    
                    # Delete from database first
                    # Delete stats
                    self.supabase_client.table('wallpaper_stats').delete().eq('wallpaper_id', wallpaper_id).execute()
                    
                    # Delete interactions
                    self.supabase_client.table('user_interactions').delete().eq('wallpaper_id', wallpaper_id).execute()
                    
                    # Delete wallpaper
                    self.supabase_client.table('wallpapers').delete().eq('id', wallpaper_id).execute()
                    
                    # Delete files from R2 storage
                    self._delete_wallpaper_files(wallpaper)
                    
                    # Clear website cache for real-time updates
                    self._clear_website_cache()
                    
                    deleted_count += 1
                    
                except Exception as e:
                    errors.append(f"{title}: {str(e)}")
            
            # Show results
            if deleted_count > 0:
                self.root.after(0, lambda: self.load_wallpapers())
                self.root.after(0, lambda: self.update_status(f"✅ Deleted {deleted_count} wallpapers", "green"))
                
                if errors:
                    self.root.after(0, lambda: messagebox.showwarning("Partial Success", 
                        f"Deleted {deleted_count} wallpapers successfully.\n\nErrors:\n" + "\n".join(errors[:5])))
                else:
                    self.root.after(0, lambda: messagebox.showinfo("Success", f"Successfully deleted {deleted_count} wallpapers!"))
            else:
                self.root.after(0, lambda: messagebox.showerror("Failed", "Failed to delete any wallpapers."))
                
        except Exception as e:
            self.root.after(0, lambda: self.update_status(f"❌ Deletion failed: {str(e)}", "red"))
            self.root.after(0, lambda: messagebox.showerror("Error", f"Deletion failed: {str(e)}"))
        finally:
            self.root.after(0, lambda: self.progress_bar.stop())
    
    def _delete_wallpaper_files(self, wallpaper):
        """Delete wallpaper files from R2 storage"""
        bucket_name = os.getenv('R2_BUCKET_NAME')
        if not bucket_name:
            return
        
        # Get all URLs
        urls = [
            wallpaper.get('image_url'),
            wallpaper.get('thumbnail_url'),
            wallpaper.get('medium_url'),
            wallpaper.get('large_url'),
            wallpaper.get('original_url')
        ]
        
        for url in urls:
            if url:
                try:
                    # Extract filename from URL
                    parsed_url = urlparse(url)
                    filename = os.path.basename(parsed_url.path)
                    
                    if filename:
                        # Delete from R2
                        self.r2_client.delete_object(Bucket=bucket_name, Key=filename)
                        
                except Exception as e:
                    print(f"Failed to delete file {url}: {e}")
    
    def _clear_website_cache(self):
        """Clear website cache to ensure real-time updates"""
        try:
            # Get the website URL (try to determine from environment or use localhost)
            website_url = os.getenv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3001')
            
            # Call the revalidation API
            revalidate_url = f"{website_url}/api/revalidate?secret=wallpaper_cache_clear_2024"
            
            # Make the request with a timeout
            response = requests.post(revalidate_url, timeout=5)
            
            if response.status_code == 200:
                print("✅ Website cache cleared successfully")
            else:
                print(f"⚠️ Cache clearing failed: {response.status_code}")
                
        except Exception as e:
            print(f"⚠️ Failed to clear website cache: {e}")
            # Don't let cache clearing errors stop the deletion process
            pass
    
    def change_category_bulk(self):
        """Change category for selected wallpapers"""
        if not self.selected_items:
            messagebox.showwarning("No Selection", "Please select wallpapers to change category")
            return
        
        # Get new category
        new_category = simpledialog.askstring("Change Category", 
                                             "Enter new category:",
                                             initialvalue="nature")
        
        if new_category and new_category.strip():
            valid_categories = ["nature", "minimal", "abstract", "urban", "space", "art"]
            if new_category not in valid_categories:
                messagebox.showerror("Invalid Category", f"Category must be one of: {', '.join(valid_categories)}")
                return
            
            threading.Thread(target=self._change_category_thread, args=(new_category.strip(),), daemon=True).start()
    
    def _change_category_thread(self, new_category):
        """Change category in separate thread"""
        try:
            self.root.after(0, lambda: self.progress_bar.start())
            self.root.after(0, lambda: self.update_status(f"Changing category to '{new_category}'...", "blue"))
            
            updated_count = 0
            for wallpaper_id in self.selected_items:
                try:
                    result = self.supabase_client.table('wallpapers').update({'category': new_category}).eq('id', wallpaper_id).execute()
                    if result.data:
                        updated_count += 1
                except:
                    pass
            
            self.root.after(0, lambda: self.load_wallpapers())
            self.root.after(0, lambda: self.update_status(f"✅ Updated {updated_count} wallpapers", "green"))
            self.root.after(0, lambda: messagebox.showinfo("Success", f"Successfully updated {updated_count} wallpapers to category '{new_category}'!"))
            
        except Exception as e:
            self.root.after(0, lambda: self.update_status(f"❌ Category change failed: {str(e)}", "red"))
            self.root.after(0, lambda: messagebox.showerror("Error", f"Category change failed: {str(e)}"))
        finally:
            self.root.after(0, lambda: self.progress_bar.stop())
    
    def export_selected(self):
        """Export selected wallpapers"""
        if not self.selected_items:
            messagebox.showwarning("No Selection", "Please select wallpapers to export")
            return
        
        # Get save location
        filename = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON files", "*.json"), ("CSV files", "*.csv"), ("All files", "*.*")]
        )
        
        if filename:
            threading.Thread(target=self._export_selected_thread, args=(filename,), daemon=True).start()
    
    def _export_selected_thread(self, filename):
        """Export in separate thread"""
        try:
            self.root.after(0, lambda: self.progress_bar.start())
            self.root.after(0, lambda: self.update_status("Exporting selected wallpapers...", "blue"))
            
            # Get selected wallpapers
            selected_wallpapers = [w for w in self.wallpapers_data if w['id'] in self.selected_items]
            
            # Export based on file extension
            if filename.lower().endswith('.csv'):
                import pandas as pd
                df = pd.DataFrame(selected_wallpapers)
                df.to_csv(filename, index=False)
            else:
                with open(filename, 'w') as f:
                    json.dump(selected_wallpapers, f, indent=2, default=str)
            
            self.root.after(0, lambda: self.update_status(f"✅ Exported {len(selected_wallpapers)} wallpapers", "green"))
            self.root.after(0, lambda: messagebox.showinfo("Success", f"Exported {len(selected_wallpapers)} wallpapers to:\n{filename}"))
            
        except Exception as e:
            self.root.after(0, lambda: self.update_status(f"❌ Export failed: {str(e)}", "red"))
            self.root.after(0, lambda: messagebox.showerror("Error", f"Export failed: {str(e)}"))
        finally:
            self.root.after(0, lambda: self.progress_bar.stop())
    
    def open_dashboard(self):
        """Open admin dashboard"""
        try:
            import subprocess
            subprocess.Popen([sys.executable, "admin_dashboard.py"])
        except Exception as e:
            messagebox.showerror("Error", f"Failed to open dashboard: {str(e)}")
    
    def run(self):
        """Start the manager"""
        self.root.mainloop()


if __name__ == "__main__":
    manager = WallpaperManager()
    manager.run()