import requests
import sqlite3
import json
import sys

def main():
    # Connect to the database
    conn = sqlite3.connect('db.sqlite3')
    cursor = conn.cursor()
    
    # Check tables in the database
    print("Checking database tables...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables in the database:")
    for table in tables:
        print(f"- {table[0]}")
    
    # Look for token table
    token_tables = [table[0] for table in tables if 'token' in table[0].lower()]
    if token_tables:
        print(f"\nFound token-related tables: {token_tables}")
        
        # Check schema of the first token table
        token_table = token_tables[0]
        cursor.execute(f"PRAGMA table_info({token_table})")
        columns = cursor.fetchall()
        print(f"\nSchema for {token_table}:")
        for col in columns:
            print(f"- {col}")
    
    # Find a city user
    print("\nLooking for CITY users...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%user%';")
    user_tables = cursor.fetchall()
    print(f"User-related tables: {user_tables}")
    
    # Try to find user table with user_type column
    for user_table in user_tables:
        try:
            cursor.execute(f"PRAGMA table_info({user_table[0]})")
            columns = [col[1] for col in cursor.fetchall()]
            if 'user_type' in columns:
                print(f"\nFound user table: {user_table[0]} with columns: {columns}")
                cursor.execute(f"SELECT id, username, user_type FROM {user_table[0]} WHERE user_type='CITY' LIMIT 1")
                city_user = cursor.fetchone()
                if city_user:
                    print(f"Found CITY user: ID={city_user[0]}, Username={city_user[1]}")
                    break
        except Exception as e:
            print(f"Error checking table {user_table[0]}: {str(e)}")
    
    # Get authentication token
    print("\nLooking for authentication tokens...")
    auth_token = None
    for token_table in token_tables:
        try:
            cursor.execute(f"SELECT * FROM {token_table} LIMIT 1")
            sample_token = cursor.fetchone()
            if sample_token:
                print(f"Sample token from {token_table}: {sample_token}")
                # Try to find a token for a city user
                if city_user:
                    cursor.execute(f"SELECT * FROM {token_table} WHERE user_id=? ORDER BY id DESC LIMIT 1", (city_user[0],))
                    user_token = cursor.fetchone()
                    if user_token:
                        # Assume token is in column 1 if not sure
                        auth_token = user_token[1] if len(user_token) > 1 else user_token[0]
                        print(f"Found token for city user: {auth_token[:10]}...")
                        break
        except Exception as e:
            print(f"Error checking token table {token_table}: {str(e)}")
    
    if not auth_token:
        print("Could not find authentication token")
        return
    
    # Get bid 26 information
    print("\nFinding bid 26...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%bid%';")
    bid_tables = cursor.fetchall()
    print(f"Bid-related tables: {bid_tables}")
    
    bid_id = 26
    bid_table = None
    for table in bid_tables:
        try:
            cursor.execute(f"SELECT * FROM {table[0]} WHERE id=? LIMIT 1", (bid_id,))
            bid_data = cursor.fetchone()
            if bid_data:
                bid_table = table[0]
                print(f"Found bid 26 in table {bid_table}")
                cursor.execute(f"PRAGMA table_info({bid_table})")
                columns = cursor.fetchall()
                print(f"Columns in {bid_table}:")
                column_names = [col[1] for col in columns]
                print(column_names)
                
                # Get indexes of important columns
                tender_idx = column_names.index('tender_id') if 'tender_id' in column_names else -1
                company_idx = column_names.index('company_id') if 'company_id' in column_names else -1
                
                if tender_idx >= 0 and company_idx >= 0:
                    tender_id = bid_data[tender_idx]
                    company_id = bid_data[company_idx]
                    print(f"Bid info: ID={bid_id}, Tender={tender_id}, Company={company_id}")
                    break
                else:
                    print(f"Could not find tender_id and company_id columns in {bid_table}")
        except Exception as e:
            print(f"Error checking bid table {table[0]}: {str(e)}")
    
    if not bid_table:
        print("Could not find bid 26")
        return
    
    # Get tender information
    print("\nFinding tender...")
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%tender%';")
    tender_tables = cursor.fetchall()
    print(f"Tender-related tables: {tender_tables}")
    
    tender_table = None
    for table in tender_tables:
        if table[0] == bid_table:  # Skip the bid table
            continue
        try:
            cursor.execute(f"SELECT * FROM {table[0]} WHERE id=? LIMIT 1", (tender_id,))
            tender_data = cursor.fetchone()
            if tender_data:
                tender_table = table[0]
                print(f"Found tender {tender_id} in table {tender_table}")
                cursor.execute(f"PRAGMA table_info({tender_table})")
                columns = cursor.fetchall()
                column_names = [col[1] for col in columns]
                print(f"Columns in {tender_table}: {column_names}")
                
                # Get indexes of important columns
                status_idx = column_names.index('status') if 'status' in column_names else -1
                deadline_idx = column_names.index('submission_deadline') if 'submission_deadline' in column_names else -1
                
                if status_idx >= 0 and deadline_idx >= 0:
                    tender_status = tender_data[status_idx]
                    deadline = tender_data[deadline_idx]
                    print(f"Tender status: {tender_status}, Deadline: {deadline}")
                    break
                else:
                    print(f"Could not find status and submission_deadline columns in {tender_table}")
        except Exception as e:
            print(f"Error checking tender table {table[0]}: {str(e)}")
    
    if not tender_table:
        print("Could not find tender")
        return
    
    # Make the request
    url = f"http://localhost:8000/api/bids/{bid_id}/select_winner/"
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {auth_token}'
    }
    data = {'confirmation': True}
    
    print(f"\nMaking request to {url}")
    print(f"Headers: {headers}")
    print(f"Data: {data}")
    
    try:
        response = requests.post(url, json=data, headers=headers)
        print(f"\nResponse status: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        try:
            response_json = response.json()
            print(f"Response JSON: {json.dumps(response_json, indent=2)}")
        except:
            print(f"Raw response: {response.text}")
            
        if response.status_code == 200:
            print("\nWINNER SELECTION SUCCESSFUL!")
        else:
            print("\nWINNER SELECTION FAILED")
            
    except Exception as e:
        print(f"Error making request: {str(e)}")
        
if __name__ == "__main__":
    main() 