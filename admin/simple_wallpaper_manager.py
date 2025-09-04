#!/usr/bin/env python3
"""
Simple Wallpaper Manager - Minimal version for testing the database issue
"""

import tkinter as tk
from tkinter import ttk, messagebox
import os
import sys
from pathlib import Path

# Load environment
env_path = Path("../.env.local")
if not env_path.exists():
    env_path = Path(".env.local")

print(f"Looking for .env.local at: {env_path.absolute()}")

if env_path.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(env_path)
        print("✅ Environment loaded")
    except ImportError:
        print("❌ python-dotenv not available")
        sys.exit(1)
else:
    print("❌ .env.local file not found!")
    sys.exit(1)

try:
    from supabase import create_client
    print("✅ Supabase imported")
except ImportError:
    print("❌ supabase not available")
    sys.exit(1)

class SimpleWallpaperManager:
    def __init__(self):
        self.root = tk.Tk()
        self.root.title("Simple Wallpaper Manager - Debug")
        self.root.geometry("800x600")
        
        # Initialize Supabase
        supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
        
        if not supabase_url or not supabase_key:
            messagebox.showerror("Error", "Missing Supabase credentials")
            sys.exit(1)
            
        try:
            self.supabase = create_client(supabase_url, supabase_key)
            print("✅ Supabase client created")
        except Exception as e:
            messagebox.showerror("Error", f"Failed to create Supabase client: {e}")
            sys.exit(1)
        
        self.setup_ui()
        self.load_wallpapers()
    
    def setup_ui(self):
        # Title
        title_label = ttk.Label(self.root, text="🖼️ Simple Wallpaper Manager", font=("Arial", 18, "bold"))
        title_label.pack(pady=20)
        
        # Load button
        load_btn = ttk.Button(self.root, text="🔄 Reload Wallpapers", command=self.load_wallpapers)
        load_btn.pack(pady=10)
        
        # Status label
        self.status_label = ttk.Label(self.root, text="Ready", foreground="blue")
        self.status_label.pack(pady=5)
        
        # Results frame
        results_frame = ttk.LabelFrame(self.root, text="Wallpapers", padding=20)
        results_frame.pack(fill=tk.BOTH, expand=True, padx=20, pady=20)
        
        # Results text area
        self.results_text = tk.Text(results_frame, wrap=tk.WORD, font=("Courier", 10))
        self.results_text.pack(fill=tk.BOTH, expand=True)
        
        scrollbar = ttk.Scrollbar(results_frame, command=self.results_text.yview)
        self.results_text.config(yscrollcommand=scrollbar.set)
        scrollbar.pack(side=tk.RIGHT, fill=tk.Y)
    
    def load_wallpapers(self):
        self.status_label.config(text="Loading wallpapers...", foreground="blue")
        self.results_text.delete(1.0, tk.END)
        
        try:
            # Method 1: Basic query
            print("🔍 Trying basic query...")
            result1 = self.supabase.table('wallpapers').select('*').execute()
            wallpapers1 = result1.data or []
            
            self.results_text.insert(tk.END, f"=== METHOD 1: Basic Query ===\n")
            self.results_text.insert(tk.END, f"Result: {len(wallpapers1)} wallpapers\n")
            self.results_text.insert(tk.END, f"Raw result type: {type(result1)}\n")
            self.results_text.insert(tk.END, f"Raw result data type: {type(result1.data)}\n")
            self.results_text.insert(tk.END, f"Raw result data: {result1.data is not None}\n\n")
            
            if wallpapers1:
                for i, wp in enumerate(wallpapers1[:3]):
                    self.results_text.insert(tk.END, f"  {i+1}. {wp.get('id', 'NO_ID')[:8]} - {wp.get('title', 'NO_TITLE')}\n")
                if len(wallpapers1) > 3:
                    self.results_text.insert(tk.END, f"  ... and {len(wallpapers1) - 3} more\n")
            
            self.results_text.insert(tk.END, "\n")
            
            # Method 2: With order
            print("🔍 Trying with order...")
            result2 = self.supabase.table('wallpapers').select('*').order('created_at', desc=True).execute()
            wallpapers2 = result2.data or []
            
            self.results_text.insert(tk.END, f"=== METHOD 2: With Order ===\n")
            self.results_text.insert(tk.END, f"Result: {len(wallpapers2)} wallpapers\n\n")
            
            if wallpapers2:
                for i, wp in enumerate(wallpapers2[:3]):
                    self.results_text.insert(tk.END, f"  {i+1}. {wp.get('id', 'NO_ID')[:8]} - {wp.get('title', 'NO_TITLE')}\n")
                if len(wallpapers2) > 3:
                    self.results_text.insert(tk.END, f"  ... and {len(wallpapers2) - 3} more\n")
            
            self.results_text.insert(tk.END, "\n")
            
            # Method 3: With limit
            print("🔍 Trying with limit...")
            result3 = self.supabase.table('wallpapers').select('*').limit(100).execute()
            wallpapers3 = result3.data or []
            
            self.results_text.insert(tk.END, f"=== METHOD 3: With Limit 100 ===\n")
            self.results_text.insert(tk.END, f"Result: {len(wallpapers3)} wallpapers\n\n")
            
            if wallpapers3:
                for i, wp in enumerate(wallpapers3[:3]):
                    self.results_text.insert(tk.END, f"  {i+1}. {wp.get('id', 'NO_ID')[:8]} - {wp.get('title', 'NO_TITLE')}\n")
                if len(wallpapers3) > 3:
                    self.results_text.insert(tk.END, f"  ... and {len(wallpapers3) - 3} more\n")
            
            # Method 4: Specific select fields
            print("🔍 Trying specific fields...")
            result4 = self.supabase.table('wallpapers').select('id, title, category, created_at').execute()
            wallpapers4 = result4.data or []
            
            self.results_text.insert(tk.END, f"\n=== METHOD 4: Specific Fields ===\n")
            self.results_text.insert(tk.END, f"Result: {len(wallpapers4)} wallpapers\n\n")
            
            if wallpapers4:
                for i, wp in enumerate(wallpapers4):
                    self.results_text.insert(tk.END, f"  {i+1}. {wp.get('id', 'NO_ID')[:8]} - {wp.get('title', 'NO_TITLE')} ({wp.get('category', 'NO_CAT')})\n")
            
            # Summary
            max_count = max(len(wallpapers1), len(wallpapers2), len(wallpapers3), len(wallpapers4))
            self.results_text.insert(tk.END, f"\n=== SUMMARY ===\n")
            self.results_text.insert(tk.END, f"Maximum wallpapers found: {max_count}\n")
            self.results_text.insert(tk.END, f"All methods returned same count: {len(set([len(wallpapers1), len(wallpapers2), len(wallpapers3), len(wallpapers4)])) == 1}\n")
            
            self.status_label.config(text=f"✅ Loaded {max_count} wallpapers", foreground="green")
            
        except Exception as e:
            error_msg = f"❌ Error loading wallpapers: {str(e)}"
            self.results_text.insert(tk.END, error_msg)
            self.status_label.config(text="❌ Loading failed", foreground="red")
            print(f"ERROR: {e}")
            messagebox.showerror("Database Error", str(e))
    
    def run(self):
        self.root.mainloop()

if __name__ == "__main__":
    try:
        manager = SimpleWallpaperManager()
        manager.run()
    except Exception as e:
        print(f"FATAL ERROR: {e}")
        messagebox.showerror("Fatal Error", str(e))