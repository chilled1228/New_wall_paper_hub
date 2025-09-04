#!/usr/bin/env python3
"""
Simple database test to check wallpaper loading
"""

import os
import sys
from pathlib import Path

# Add environment
env_path = Path("../.env.local")
if not env_path.exists():
    env_path = Path(".env.local")

if env_path.exists():
    from dotenv import load_dotenv
    load_dotenv(env_path)
else:
    print("ERROR: .env.local file not found!")
    sys.exit(1)

try:
    from supabase import create_client
except ImportError:
    print("ERROR: supabase not installed. Run: pip install supabase")
    sys.exit(1)

# Initialize Supabase
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

if not supabase_url or not supabase_key:
    print("ERROR: Missing Supabase credentials in .env.local")
    sys.exit(1)

supabase = create_client(supabase_url, supabase_key)

print("Testing database connection...")

try:
    # Test wallpapers table
    result = supabase.table('wallpapers').select('id, title, category, created_at').order('created_at', desc=True).execute()
    wallpapers = result.data
    
    print(f"SUCCESS: Found {len(wallpapers)} wallpapers")
    
    if wallpapers:
        print("\nFirst 5 wallpapers:")
        for i, wallpaper in enumerate(wallpapers[:5]):
            print(f"{i+1}. {wallpaper.get('id', 'NO_ID')[:8]} - {wallpaper.get('title', 'NO_TITLE')} ({wallpaper.get('category', 'NO_CATEGORY')})")
    
    # Test stats table
    stats_result = supabase.table('wallpaper_stats').select('wallpaper_id, downloads, likes, views').execute()
    stats = stats_result.data
    
    print(f"\nSTATS: Found {len(stats)} stats records")
    
    if stats:
        print("First 5 stats:")
        for i, stat in enumerate(stats[:5]):
            print(f"{i+1}. {stat.get('wallpaper_id', 'NO_ID')[:8]} - D:{stat.get('downloads', 0)} L:{stat.get('likes', 0)} V:{stat.get('views', 0)}")
    
except Exception as e:
    print(f"ERROR: Database query failed: {e}")
    sys.exit(1)

print("\nDatabase connection test completed successfully!")