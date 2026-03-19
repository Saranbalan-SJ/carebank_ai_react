
import sqlite3
import bcrypt
import os

from database import DB_PATH # I ensured this is absolute in database.py

def seed_admin():
    username = "admin_manager"
    password = "password123"
    role = "banker"
    
    # Hash password using bcrypt (same as auth.py)
    salt = bcrypt.gensalt()
    hashed_pw = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()
        
        if not user:
            print(f"Creating default banker: {username}...")
            cursor.execute(
                "INSERT INTO users (username, hashed_password, role) VALUES (?, ?, ?)",
                (username, hashed_pw, role)
            )
            conn.commit()
            print("Successfully created admin_manager.")
        else:
            print(f"User {username} already exists. Updating to 'banker' role just in case.")
            cursor.execute("UPDATE users SET role = ? WHERE username = ?", (role, username))
            conn.commit()
            
        conn.close()
    except Exception as e:
        print(f"Seeding failed: {e}")

if __name__ == "__main__":
    seed_admin()
