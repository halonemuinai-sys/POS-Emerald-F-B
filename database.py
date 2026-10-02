import os
import json
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

CONFIG_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.json')

def load_config():
    if os.path.exists(CONFIG_PATH):
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {
        "db_type": "postgres",
        "postgres": {
            "host": "127.0.0.1",
            "port": 5432,
            "user": "postgres",
            "password": "",
            "database": "pos_emerald"
        },
        "importer": {
            "source_directory": ".",
            "file_patterns": ["*.xls", "*.xlsx"],
            "batch_size": 2000,
            "skip_already_imported": True
        }
    }

def get_connection(use_database=True):
    cfg = load_config().get("postgres", {})
    params = {
        "host": cfg.get("host", "127.0.0.1"),
        "port": int(cfg.get("port", 5432)),
        "user": cfg.get("user", "postgres"),
        "password": cfg.get("password", "")
    }
    if use_database:
        params["dbname"] = cfg.get("database", "pos_emerald")
    else:
        params["dbname"] = "postgres"
        
    conn = psycopg2.connect(**params)
    conn.autocommit = False
    return conn

def init_database():
    cfg = load_config()
    pg_cfg = cfg.get("postgres", {})
    db_name = pg_cfg.get("database", "pos_emerald")
    
    # 1. Connect to postgres default DB to ensure pos_emerald exists
    conn = get_connection(use_database=False)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    try:
        with conn.cursor() as cur:
            cur.execute(f"SELECT 1 FROM pg_database WHERE datname = '{db_name}';")
            if not cur.fetchone():
                cur.execute(f"CREATE DATABASE {db_name};")
                print(f"Created database: {db_name}")
    finally:
        conn.close()

    # 2. Execute schema_pg.sql
    schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'schema_pg.sql')
    if os.path.exists(schema_path):
        conn = get_connection(use_database=True)
        try:
            with open(schema_path, 'r', encoding='utf-8') as f:
                schema_sql = f.read()
            with conn.cursor() as cur:
                cur.execute(schema_sql)
            conn.commit()
            print("PostgreSQL database & schema initialized successfully!")
        finally:
            conn.close()

if __name__ == '__main__':
    init_database()
