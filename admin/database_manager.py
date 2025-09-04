#!/usr/bin/env python3
"""
Database Manager - Advanced database operations and maintenance
Features:
- Database health checks
- Data validation and cleanup
- Backup and restore operations  
- Performance optimization
- Migration tools
"""

import os
import sys
from pathlib import Path
import json
import csv
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import hashlib
import shutil

# Third-party imports
try:
    from dotenv import load_dotenv
    from supabase import create_client, Client
    import pandas as pd
except ImportError as e:
    print(f"Missing required package: {e}")
    print("Please install requirements: pip install -r requirements.txt")
    sys.exit(1)

class DatabaseManager:
    """Advanced database management operations"""
    
    def __init__(self):
        self.load_environment()
        self.initialize_client()
        self.backup_dir = Path("backups")
        self.backup_dir.mkdir(exist_ok=True)
        
    def load_environment(self):
        """Load environment variables"""
        env_path = Path(".env.local")
        if env_path.exists():
            load_dotenv(env_path)
        else:
            raise FileNotFoundError(".env.local file not found!")
    
    def initialize_client(self):
        """Initialize Supabase client"""
        try:
            supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
            supabase_key = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
            self.supabase_client = create_client(supabase_url, supabase_key)
            print("✅ Connected to Supabase database")
        except Exception as e:
            raise Exception(f"Failed to connect to database: {str(e)}")
    
    def health_check(self) -> Dict:
        """Perform comprehensive database health check"""
        print("🔍 Performing database health check...")
        
        health_report = {
            'timestamp': datetime.now().isoformat(),
            'overall_status': 'healthy',
            'issues': [],
            'recommendations': [],
            'tables': {}
        }
        
        try:
            # Check wallpapers table
            wallpapers_health = self._check_wallpapers_table()
            health_report['tables']['wallpapers'] = wallpapers_health
            
            # Check wallpaper_stats table
            stats_health = self._check_wallpaper_stats_table()
            health_report['tables']['wallpaper_stats'] = stats_health
            
            # Check user_interactions table
            interactions_health = self._check_user_interactions_table()
            health_report['tables']['user_interactions'] = interactions_health
            
            # Check data consistency
            consistency_check = self._check_data_consistency()
            health_report['consistency'] = consistency_check
            
            # Check for orphaned records
            orphan_check = self._check_orphaned_records()
            health_report['orphaned_records'] = orphan_check
            
            # Aggregate issues
            all_issues = []
            for table_health in health_report['tables'].values():
                all_issues.extend(table_health.get('issues', []))
            all_issues.extend(consistency_check.get('issues', []))
            all_issues.extend(orphan_check.get('issues', []))
            
            health_report['issues'] = all_issues
            
            if all_issues:
                health_report['overall_status'] = 'issues_found'
            
            return health_report
            
        except Exception as e:
            health_report['overall_status'] = 'error'
            health_report['issues'].append(f"Health check failed: {str(e)}")
            return health_report
    
    def _check_wallpapers_table(self) -> Dict:
        """Check wallpapers table health"""
        try:
            # Get all wallpapers
            result = self.supabase_client.table('wallpapers').select('*').execute()
            wallpapers = result.data
            
            issues = []
            recommendations = []
            
            # Check for missing required fields
            for wallpaper in wallpapers:
                if not wallpaper.get('title'):
                    issues.append(f"Wallpaper {wallpaper['id']} missing title")
                
                if not wallpaper.get('image_url'):
                    issues.append(f"Wallpaper {wallpaper['id']} missing image_url")
                
                if not wallpaper.get('category'):
                    issues.append(f"Wallpaper {wallpaper['id']} missing category")
            
            # Check for missing optimized images
            missing_thumbnails = len([w for w in wallpapers if not w.get('thumbnail_url')])
            missing_medium = len([w for w in wallpapers if not w.get('medium_url')])
            missing_large = len([w for w in wallpapers if not w.get('large_url')])
            missing_original = len([w for w in wallpapers if not w.get('original_url')])
            
            if missing_thumbnails > 0:
                recommendations.append(f"{missing_thumbnails} wallpapers missing thumbnails")
            if missing_medium > 0:
                recommendations.append(f"{missing_medium} wallpapers missing medium resolution")
            if missing_large > 0:
                recommendations.append(f"{missing_large} wallpapers missing large resolution")
            if missing_original > 0:
                recommendations.append(f"{missing_original} wallpapers missing original resolution")
            
            return {
                'total_records': len(wallpapers),
                'issues': issues,
                'recommendations': recommendations,
                'status': 'healthy' if not issues else 'issues_found'
            }
            
        except Exception as e:
            return {
                'total_records': 0,
                'issues': [f"Failed to check wallpapers table: {str(e)}"],
                'recommendations': [],
                'status': 'error'
            }
    
    def _check_wallpaper_stats_table(self) -> Dict:
        """Check wallpaper_stats table health"""
        try:
            result = self.supabase_client.table('wallpaper_stats').select('*').execute()
            stats = result.data
            
            issues = []
            recommendations = []
            
            # Check for negative values
            for stat in stats:
                if stat.get('downloads', 0) < 0:
                    issues.append(f"Negative downloads for wallpaper {stat['wallpaper_id']}")
                if stat.get('likes', 0) < 0:
                    issues.append(f"Negative likes for wallpaper {stat['wallpaper_id']}")
                if stat.get('views', 0) < 0:
                    issues.append(f"Negative views for wallpaper {stat['wallpaper_id']}")
            
            return {
                'total_records': len(stats),
                'issues': issues,
                'recommendations': recommendations,
                'status': 'healthy' if not issues else 'issues_found'
            }
            
        except Exception as e:
            return {
                'total_records': 0,
                'issues': [f"Failed to check wallpaper_stats table: {str(e)}"],
                'recommendations': [],
                'status': 'error'
            }
    
    def _check_user_interactions_table(self) -> Dict:
        """Check user_interactions table health"""
        try:
            result = self.supabase_client.table('user_interactions').select('*').execute()
            interactions = result.data
            
            issues = []
            recommendations = []
            
            # Check for invalid interaction types
            valid_types = ['view', 'like', 'download']
            for interaction in interactions:
                if interaction['interaction_type'] not in valid_types:
                    issues.append(f"Invalid interaction type: {interaction['interaction_type']}")
            
            # Check for very old interactions (suggest cleanup)
            cutoff_date = datetime.now() - timedelta(days=365)
            old_interactions = [
                i for i in interactions 
                if datetime.fromisoformat(i['created_at'].replace('Z', '+00:00')) < cutoff_date
            ]
            
            if old_interactions:
                recommendations.append(f"{len(old_interactions)} interactions older than 1 year (consider cleanup)")
            
            return {
                'total_records': len(interactions),
                'old_records': len(old_interactions),
                'issues': issues,
                'recommendations': recommendations,
                'status': 'healthy' if not issues else 'issues_found'
            }
            
        except Exception as e:
            return {
                'total_records': 0,
                'issues': [f"Failed to check user_interactions table: {str(e)}"],
                'recommendations': [],
                'status': 'error'
            }
    
    def _check_data_consistency(self) -> Dict:
        """Check data consistency across tables"""
        try:
            issues = []
            
            # Get all wallpaper IDs
            wallpapers_result = self.supabase_client.table('wallpapers').select('id').execute()
            wallpaper_ids = set(w['id'] for w in wallpapers_result.data)
            
            # Check wallpaper_stats references
            stats_result = self.supabase_client.table('wallpaper_stats').select('wallpaper_id').execute()
            stats_wallpaper_ids = set(s['wallpaper_id'] for s in stats_result.data)
            
            # Check user_interactions references
            interactions_result = self.supabase_client.table('user_interactions').select('wallpaper_id').execute()
            interaction_wallpaper_ids = set(i['wallpaper_id'] for i in interactions_result.data)
            
            # Find orphaned stats
            orphaned_stats = stats_wallpaper_ids - wallpaper_ids
            if orphaned_stats:
                issues.append(f"{len(orphaned_stats)} orphaned wallpaper_stats records")
            
            # Find orphaned interactions
            orphaned_interactions = interaction_wallpaper_ids - wallpaper_ids
            if orphaned_interactions:
                issues.append(f"{len(orphaned_interactions)} orphaned user_interactions records")
            
            return {
                'issues': issues,
                'orphaned_stats_count': len(orphaned_stats),
                'orphaned_interactions_count': len(orphaned_interactions),
                'status': 'consistent' if not issues else 'inconsistent'
            }
            
        except Exception as e:
            return {
                'issues': [f"Failed to check data consistency: {str(e)}"],
                'status': 'error'
            }
    
    def _check_orphaned_records(self) -> Dict:
        """Check for orphaned records"""
        try:
            issues = []
            
            # Get all wallpapers with stats
            wallpapers_result = self.supabase_client.table('wallpapers').select('id').execute()
            wallpaper_ids = set(w['id'] for w in wallpapers_result.data)
            
            stats_result = self.supabase_client.table('wallpaper_stats').select('wallpaper_id').execute()
            stats_wallpaper_ids = set(s['wallpaper_id'] for s in stats_result.data)
            
            # Wallpapers without stats
            wallpapers_without_stats = wallpaper_ids - stats_wallpaper_ids
            if wallpapers_without_stats:
                issues.append(f"{len(wallpapers_without_stats)} wallpapers without stats records")
            
            return {
                'wallpapers_without_stats': len(wallpapers_without_stats),
                'issues': issues,
                'status': 'clean' if not issues else 'orphaned_found'
            }
            
        except Exception as e:
            return {
                'issues': [f"Failed to check orphaned records: {str(e)}"],
                'status': 'error'
            }
    
    def backup_database(self, backup_name: Optional[str] = None) -> str:
        """Create a complete database backup"""
        if not backup_name:
            backup_name = f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        backup_path = self.backup_dir / backup_name
        backup_path.mkdir(exist_ok=True)
        
        print(f"🔄 Creating database backup: {backup_name}")
        
        try:
            # Backup wallpapers
            wallpapers_result = self.supabase_client.table('wallpapers').select('*').execute()
            with open(backup_path / 'wallpapers.json', 'w') as f:
                json.dump(wallpapers_result.data, f, indent=2, default=str)
            
            # Backup wallpaper_stats
            stats_result = self.supabase_client.table('wallpaper_stats').select('*').execute()
            with open(backup_path / 'wallpaper_stats.json', 'w') as f:
                json.dump(stats_result.data, f, indent=2, default=str)
            
            # Backup user_interactions
            interactions_result = self.supabase_client.table('user_interactions').select('*').execute()
            with open(backup_path / 'user_interactions.json', 'w') as f:
                json.dump(interactions_result.data, f, indent=2, default=str)
            
            # Create backup manifest
            manifest = {
                'backup_name': backup_name,
                'created_at': datetime.now().isoformat(),
                'tables': {
                    'wallpapers': len(wallpapers_result.data),
                    'wallpaper_stats': len(stats_result.data),
                    'user_interactions': len(interactions_result.data)
                },
                'total_records': sum([
                    len(wallpapers_result.data),
                    len(stats_result.data),
                    len(interactions_result.data)
                ])
            }
            
            with open(backup_path / 'manifest.json', 'w') as f:
                json.dump(manifest, f, indent=2)
            
            print(f"✅ Backup completed: {backup_path}")
            print(f"   📊 {manifest['total_records']} total records backed up")
            
            return str(backup_path)
            
        except Exception as e:
            print(f"❌ Backup failed: {str(e)}")
            # Clean up partial backup
            if backup_path.exists():
                shutil.rmtree(backup_path)
            raise
    
    def list_backups(self) -> List[Dict]:
        """List all available backups"""
        backups = []
        
        for backup_dir in self.backup_dir.iterdir():
            if backup_dir.is_dir():
                manifest_path = backup_dir / 'manifest.json'
                if manifest_path.exists():
                    try:
                        with open(manifest_path, 'r') as f:
                            manifest = json.load(f)
                        backups.append(manifest)
                    except:
                        # Invalid backup, create basic info
                        backups.append({
                            'backup_name': backup_dir.name,
                            'created_at': 'Unknown',
                            'status': 'Corrupted'
                        })
        
        return sorted(backups, key=lambda x: x.get('created_at', ''), reverse=True)
    
    def validate_data(self) -> Dict:
        """Validate all data integrity"""
        print("🔍 Validating data integrity...")
        
        validation_report = {
            'timestamp': datetime.now().isoformat(),
            'issues_found': [],
            'fixes_applied': [],
            'status': 'valid'
        }
        
        try:
            # Validate wallpapers
            wallpapers_result = self.supabase_client.table('wallpapers').select('*').execute()
            
            for wallpaper in wallpapers_result.data:
                # Check required fields
                if not wallpaper.get('title'):
                    validation_report['issues_found'].append(f"Missing title: {wallpaper['id']}")
                
                if not wallpaper.get('category'):
                    validation_report['issues_found'].append(f"Missing category: {wallpaper['id']}")
                
                # Validate category values
                valid_categories = ['nature', 'minimal', 'abstract', 'urban', 'space', 'art']
                if wallpaper.get('category') not in valid_categories:
                    validation_report['issues_found'].append(f"Invalid category '{wallpaper.get('category')}': {wallpaper['id']}")
            
            # Check for duplicate titles
            titles = [w['title'] for w in wallpapers_result.data if w.get('title')]
            duplicate_titles = set([title for title in titles if titles.count(title) > 1])
            
            for dup_title in duplicate_titles:
                validation_report['issues_found'].append(f"Duplicate title: '{dup_title}'")
            
            if validation_report['issues_found']:
                validation_report['status'] = 'issues_found'
            
            return validation_report
            
        except Exception as e:
            validation_report['status'] = 'error'
            validation_report['issues_found'].append(f"Validation failed: {str(e)}")
            return validation_report
    
    def cleanup_old_interactions(self, days_old: int = 365) -> Dict:
        """Clean up old user interactions"""
        cutoff_date = datetime.now() - timedelta(days=days_old)
        cutoff_iso = cutoff_date.isoformat()
        
        print(f"🧹 Cleaning interactions older than {days_old} days...")
        
        try:
            # Get count of old interactions first
            old_interactions = self.supabase_client.table('user_interactions').select('id').lt('created_at', cutoff_iso).execute()
            old_count = len(old_interactions.data)
            
            if old_count == 0:
                return {'deleted_count': 0, 'status': 'no_old_records'}
            
            # Delete old interactions
            result = self.supabase_client.table('user_interactions').delete().lt('created_at', cutoff_iso).execute()
            
            print(f"✅ Deleted {old_count} old interactions")
            
            return {
                'deleted_count': old_count,
                'cutoff_date': cutoff_iso,
                'status': 'success'
            }
            
        except Exception as e:
            print(f"❌ Cleanup failed: {str(e)}")
            return {'deleted_count': 0, 'error': str(e), 'status': 'error'}
    
    def fix_missing_stats(self) -> Dict:
        """Create missing wallpaper_stats records"""
        print("🔧 Fixing missing wallpaper stats...")
        
        try:
            # Get all wallpapers
            wallpapers = self.supabase_client.table('wallpapers').select('id').execute().data
            wallpaper_ids = set(w['id'] for w in wallpapers)
            
            # Get existing stats
            stats = self.supabase_client.table('wallpaper_stats').select('wallpaper_id').execute().data
            existing_stats_ids = set(s['wallpaper_id'] for s in stats)
            
            # Find missing stats
            missing_stats_ids = wallpaper_ids - existing_stats_ids
            
            if not missing_stats_ids:
                return {'created_count': 0, 'status': 'no_missing_stats'}
            
            # Create missing stats records
            new_stats = []
            for wallpaper_id in missing_stats_ids:
                new_stats.append({
                    'wallpaper_id': wallpaper_id,
                    'downloads': 0,
                    'likes': 0,
                    'views': 0
                })
            
            # Insert new stats
            result = self.supabase_client.table('wallpaper_stats').insert(new_stats).execute()
            
            print(f"✅ Created {len(missing_stats_ids)} missing stats records")
            
            return {
                'created_count': len(missing_stats_ids),
                'status': 'success'
            }
            
        except Exception as e:
            print(f"❌ Fix failed: {str(e)}")
            return {'created_count': 0, 'error': str(e), 'status': 'error'}
    
    def export_data(self, format: str = 'csv', output_dir: str = 'exports') -> str:
        """Export database data to files"""
        export_path = Path(output_dir)
        export_path.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        print(f"📤 Exporting data to {format.upper()} format...")
        
        try:
            # Export wallpapers
            wallpapers = self.supabase_client.table('wallpapers').select('*').execute().data
            
            if format == 'csv':
                df = pd.DataFrame(wallpapers)
                df.to_csv(export_path / f'wallpapers_{timestamp}.csv', index=False)
            else:
                with open(export_path / f'wallpapers_{timestamp}.json', 'w') as f:
                    json.dump(wallpapers, f, indent=2, default=str)
            
            # Export stats
            stats = self.supabase_client.table('wallpaper_stats').select('*').execute().data
            
            if format == 'csv':
                df = pd.DataFrame(stats)
                df.to_csv(export_path / f'wallpaper_stats_{timestamp}.csv', index=False)
            else:
                with open(export_path / f'wallpaper_stats_{timestamp}.json', 'w') as f:
                    json.dump(stats, f, indent=2, default=str)
            
            print(f"✅ Data exported to {export_path}")
            
            return str(export_path)
            
        except Exception as e:
            print(f"❌ Export failed: {str(e)}")
            raise


def main():
    """CLI interface for database management"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Database Management Tool')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Health check command
    parser_health = subparsers.add_parser('health', help='Perform health check')
    
    # Backup command
    parser_backup = subparsers.add_parser('backup', help='Create database backup')
    parser_backup.add_argument('--name', help='Backup name')
    
    # List backups command
    parser_list = subparsers.add_parser('list-backups', help='List all backups')
    
    # Validate command
    parser_validate = subparsers.add_parser('validate', help='Validate data integrity')
    
    # Cleanup command
    parser_cleanup = subparsers.add_parser('cleanup', help='Clean old interactions')
    parser_cleanup.add_argument('--days', type=int, default=365, help='Days old to clean')
    
    # Fix command
    parser_fix = subparsers.add_parser('fix-stats', help='Fix missing wallpaper stats')
    
    # Export command
    parser_export = subparsers.add_parser('export', help='Export data')
    parser_export.add_argument('--format', choices=['csv', 'json'], default='csv', help='Export format')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # Initialize database manager
    try:
        db_manager = DatabaseManager()
    except Exception as e:
        print(f"❌ Failed to initialize: {e}")
        return
    
    # Execute commands
    try:
        if args.command == 'health':
            report = db_manager.health_check()
            print(f"\n📊 Health Check Report:")
            print(f"Status: {report['overall_status']}")
            if report['issues']:
                print(f"Issues found: {len(report['issues'])}")
                for issue in report['issues']:
                    print(f"  ⚠️ {issue}")
            else:
                print("✅ No issues found")
                
        elif args.command == 'backup':
            backup_path = db_manager.backup_database(args.name)
            
        elif args.command == 'list-backups':
            backups = db_manager.list_backups()
            print(f"\n📦 Available Backups ({len(backups)}):")
            for backup in backups:
                print(f"  • {backup['backup_name']} - {backup.get('created_at', 'Unknown')}")
                
        elif args.command == 'validate':
            report = db_manager.validate_data()
            print(f"\n✅ Validation Report:")
            print(f"Status: {report['status']}")
            if report['issues_found']:
                for issue in report['issues_found']:
                    print(f"  ⚠️ {issue}")
                    
        elif args.command == 'cleanup':
            result = db_manager.cleanup_old_interactions(args.days)
            
        elif args.command == 'fix-stats':
            result = db_manager.fix_missing_stats()
            
        elif args.command == 'export':
            export_path = db_manager.export_data(args.format)
            
    except Exception as e:
        print(f"❌ Command failed: {e}")


if __name__ == "__main__":
    main()