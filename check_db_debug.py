
import sqlite3
import os

def check_db(path):
    print(f"Checking database at: {os.path.abspath(path)}")
    if not os.path.exists(path):
        print("File does not exist.")
        return
    
    try:
        conn = sqlite3.connect(path)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(users)")
        cols = cursor.fetchall()
        print(f"Columns in 'users': {[c[1] for c in cols]}")
        cursor.execute("SELECT COUNT(*) FROM users")
        print(f"Total users: {cursor.fetchone()[0]}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_db("backend/carebank.db")
    check_db("carebank.db")
