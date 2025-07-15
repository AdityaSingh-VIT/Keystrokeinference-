import os
import logging
import time
from flask import Flask
from models import db
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import exc

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET", "keyboard-acoustic-detection")

# Configure database
# Use PostgreSQL if DATABASE_URL is provided, otherwise use SQLite for local development
database_url = os.environ.get('DATABASE_URL')
use_sqlite = False

if database_url:
    try:
        # Handle potential "postgres://" vs "postgresql://" difference
        if database_url.startswith('postgres://'):
            database_url = database_url.replace('postgres://', 'postgresql://', 1)
            
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
        
        # Add more robust connection pool settings
        app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
            'pool_pre_ping': True,     # Test connections before using them
            'pool_recycle': 60,        # Recycle connections every minute for testing
            'pool_timeout': 10,        # Wait up to 10 seconds for a connection
            'max_overflow': 5,         # Allow up to 5 overflow connections
            'connect_args': {
                'connect_timeout': 10,  # Connection timeout in seconds
                'keepalives': 1,        # Enable keepalives
                'keepalives_idle': 30,  # Seconds between keepalives
                'keepalives_interval': 10, # Seconds between keepalive probes
                'keepalives_count': 5    # Number of keepalive probes
            }
        }
        logger.info("Using PostgreSQL database")
    except Exception as e:
        logger.error(f"Error configuring PostgreSQL: {e}, falling back to SQLite")
        use_sqlite = True
else:
    use_sqlite = True
    logger.info("No DATABASE_URL provided")

if use_sqlite:
    # Use SQLite for local development or as fallback
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///keyboard_acoustic.db'
    logger.info("Using SQLite database for local development")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the database with retries
max_retries = 3
retry_delay = 2

for attempt in range(max_retries):
    try:
        db.init_app(app)
        logger.info("Database initialized successfully")
        break
    except Exception as e:
        logger.error(f"Database initialization attempt {attempt+1} failed: {e}")
        if attempt < max_retries - 1:
            logger.info(f"Retrying in {retry_delay} seconds...")
            time.sleep(retry_delay)
            retry_delay *= 2  # Exponential backoff
        else:
            logger.error("All database initialization attempts failed")
            # Continue anyway, since we can fall back to SQLite

# Create database tables with retries
max_db_retries = 3
db_retry_delay = 2

with app.app_context():
    for db_attempt in range(max_db_retries):
        try:
            db.create_all()
            logger.info("Database tables created successfully")
            break
        except exc.SQLAlchemyError as e:
            logger.error(f"Database creation attempt {db_attempt+1} failed: {e}")
            if db_attempt < max_db_retries - 1:
                logger.info(f"Retrying database creation in {db_retry_delay} seconds...")
                time.sleep(db_retry_delay)
                db_retry_delay *= 2  # Exponential backoff
            else:
                logger.error("All database creation attempts failed. Application may not function correctly.")
        except Exception as e:
            logger.error(f"Unexpected error creating database tables: {e}")
            break

# Import routes after app initialization to avoid circular imports
from app import *

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
