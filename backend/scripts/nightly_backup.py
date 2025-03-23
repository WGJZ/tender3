#!/usr/bin/env python
"""
Nightly backup script for the e-tendering system.
This script should be scheduled to run every night using a cron job or similar scheduler.

Example crontab entry (runs at 2 AM every night):
0 2 * * * /path/to/python /path/to/project/backend/scripts/nightly_backup.py
"""

import os
import sys
import time
import datetime
import subprocess
import shutil
import logging

# Add the project to the Python path
project_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(project_path)

# Setup logging
log_dir = os.path.join(project_path, 'logs')
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

logging.basicConfig(
    filename=os.path.join(log_dir, 'backup.log'),
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Get Django settings
try:
    from django.conf import settings
    from tender_project.settings import DATABASES
except ImportError:
    logging.error("Could not import Django settings. Make sure the script is run from the correct directory.")
    sys.exit(1)

def create_backup():
    """Create a backup of the database and media files"""
    timestamp = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_dir = os.path.join(project_path, 'backups', timestamp)
    
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
    
    # Database backup
    db_settings = DATABASES['default']
    db_name = db_settings['NAME']
    db_user = db_settings.get('USER', '')
    db_password = db_settings.get('PASSWORD', '')
    db_host = db_settings.get('HOST', 'localhost')
    db_port = db_settings.get('PORT', '')
    
    db_backup_path = os.path.join(backup_dir, 'db_backup.sql')
    
    if db_settings['ENGINE'] == 'django.db.backends.sqlite3':
        # SQLite backup
        try:
            shutil.copy2(db_name, os.path.join(backup_dir, os.path.basename(db_name)))
            logging.info(f"SQLite database backup created at {backup_dir}")
        except Exception as e:
            logging.error(f"SQLite backup failed: {str(e)}")
            return False
    elif db_settings['ENGINE'] == 'django.db.backends.postgresql':
        # PostgreSQL backup
        pg_dump_cmd = [
            'pg_dump',
            f'--dbname=postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}',
            '-f', db_backup_path
        ]
        try:
            subprocess.run(pg_dump_cmd, check=True)
            logging.info(f"PostgreSQL database backup created at {db_backup_path}")
        except Exception as e:
            logging.error(f"PostgreSQL backup failed: {str(e)}")
            return False
    
    # Media files backup
    media_dir = os.path.join(project_path, 'media')
    media_backup_dir = os.path.join(backup_dir, 'media')
    
    try:
        if os.path.exists(media_dir):
            shutil.copytree(media_dir, media_backup_dir)
            logging.info(f"Media files backup created at {media_backup_dir}")
    except Exception as e:
        logging.error(f"Media files backup failed: {str(e)}")
        return False
    
    # Cleanup old backups (keep last 7 days)
    cleanup_old_backups(7)
    
    return True

def cleanup_old_backups(days_to_keep):
    """Remove backups older than days_to_keep days"""
    backups_dir = os.path.join(project_path, 'backups')
    if not os.path.exists(backups_dir):
        return
    
    now = time.time()
    cutoff = now - (days_to_keep * 24 * 60 * 60)
    
    for item in os.listdir(backups_dir):
        item_path = os.path.join(backups_dir, item)
        if os.path.isdir(item_path):
            if os.path.getctime(item_path) < cutoff:
                try:
                    shutil.rmtree(item_path)
                    logging.info(f"Removed old backup: {item_path}")
                except Exception as e:
                    logging.error(f"Failed to remove old backup {item_path}: {str(e)}")

if __name__ == "__main__":
    logging.info("Starting nightly backup")
    success = create_backup()
    
    if success:
        logging.info("Backup completed successfully")
    else:
        logging.error("Backup failed") 