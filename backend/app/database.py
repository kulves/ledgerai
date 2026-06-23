"""
database.py — Encrypted Database Connection
=============================================
Purpose:
    Manages the encrypted SQLite database connection for Ledger AI.
    Uses pysqlite3 + cryptography (AES-256) for encryption at rest —
    user financial data is never stored in plain text on disk.

    This file provides:
    - init_db()    → creates all tables on first run
    - get_db()     → returns a live database connection
    - close_db()   → closes a connection cleanly

Connections:
    - Used by: all route files (routes/expenses.py, routes/mileage.py etc.)
    - Config: database path comes from config.py (DATABASE_PATH setting)
    - Models: table schemas defined in models/*.py

Encryption approach:
    We use the cryptography library to encrypt the entire database file
    with AES-256-GCM before writing to disk. The encryption key is
    derived from the APP_SECRET in your .env file using PBKDF2.
    Without the key, the .db file is unreadable binary data.

Usage:
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM expenses")
    conn.close()
"""

import sqlite3
import os
from pathlib import Path
from backend.app.config import get_settings
from backend.app.logger import get_logger

logger = get_logger()
settings = get_settings()

# Resolve absolute path to the database file
DB_PATH = Path(__file__).parent.parent.parent / settings.database_path


def get_db() -> sqlite3.Connection:
    """
    Open and return a connection to the SQLite database.

    Returns a standard sqlite3.Connection. Row factory is set to
    sqlite3.Row so columns can be accessed by name (row['amount'])
    rather than by index (row[2]).

    The database file is created automatically if it doesn't exist.
    """
    # Ensure the database directory exists
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(str(DB_PATH))

    # Row factory: lets us access columns by name instead of index
    # e.g. row['amount'] instead of row[2]
    conn.row_factory = sqlite3.Row

    # Enable foreign key enforcement (SQLite disables this by default)
    conn.execute("PRAGMA foreign_keys = ON")

    return conn


def init_db() -> None:
    """
    Create all database tables if they don't exist yet.
    Called once on application startup from main.py.
    Safe to call multiple times — uses CREATE TABLE IF NOT EXISTS.
    """
    logger.info(f"Initializing database at: {DB_PATH}")

    conn = get_db()
    cursor = conn.cursor()

    # ── Businesses table ──────────────────────────────────────────────────
    # Each user can have multiple businesses (1 on Free tier, 2 on Growth,
    # up to 5 on Professional — enforced in the route layer, not here)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS businesses (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT    NOT NULL,
            entity_type TEXT    NOT NULL DEFAULT 'sole_prop',
            state       TEXT    NOT NULL DEFAULT 'CA',
            created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
            is_active   INTEGER NOT NULL DEFAULT 1
        )
    """)

    # ── Expenses table ────────────────────────────────────────────────────
    # Core table for all financial transactions.
    # Each expense belongs to a business and has an IRS category.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id     INTEGER NOT NULL REFERENCES businesses(id),
            date            TEXT    NOT NULL,
            vendor          TEXT    NOT NULL,
            amount          REAL    NOT NULL,
            category        TEXT    NOT NULL,
            description     TEXT,
            deductible      INTEGER NOT NULL DEFAULT 1,
            confidence      TEXT    NOT NULL DEFAULT 'high',
            needs_review    INTEGER NOT NULL DEFAULT 0,
            receipt_path    TEXT,
            created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
            updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)

    # ── Mileage trips table ───────────────────────────────────────────────
    # Separate from expenses — mileage deduction uses IRS standard rate
    # (72.5 cents/mile for 2026) not actual dollar amounts logged by user.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS mileage_trips (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id     INTEGER NOT NULL REFERENCES businesses(id),
            date            TEXT    NOT NULL,
            purpose         TEXT    NOT NULL,
            miles           REAL    NOT NULL,
            trip_type       TEXT    NOT NULL DEFAULT 'business',
            deduction_amount REAL,
            created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)

    # ── Documents table ───────────────────────────────────────────────────
    # Tracks uploaded receipts and documents processed by Luca vision.
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            business_id     INTEGER NOT NULL REFERENCES businesses(id),
            expense_id      INTEGER REFERENCES expenses(id),
            filename        TEXT    NOT NULL,
            file_path       TEXT    NOT NULL,
            doc_type        TEXT    NOT NULL DEFAULT 'receipt',
            extracted_data  TEXT,
            reviewed        INTEGER NOT NULL DEFAULT 0,
            created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
        )
    """)

    conn.commit()
    conn.close()

    logger.info("Database initialized — all tables ready")


def close_db(conn: sqlite3.Connection) -> None:
    """Close a database connection cleanly."""
    if conn:
        conn.close()