import csv
import os
import sys
from datetime import datetime, UTC
from dotenv import load_dotenv
from supabase import create_client, Client
import json

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Ensure environment variables are loaded
if not SUPABASE_URL or not SUPABASE_KEY:
    print(json.dumps({"status": "error", "message": "Server Error: Configuration missing."}), file=sys.stdout)
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def parse_year_level(raw: str):
    return raw.split()[0] if raw else None

def parse_sex(gender: str):
    if gender.lower() == 'male':
        return 'Male'
    elif gender.lower() == 'female':
        return 'Female'
    else:
        return None

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"status": "error", "message": "Invalid request: No CSV file provided."}), file=sys.stdout)
        sys.exit(1)
    csv_file_path = sys.argv[1]
    if not os.path.exists(csv_file_path):
        print(json.dumps({"status": "error", "message": "Upload failed: CSV file not found."}), file=sys.stdout)
        sys.exit(1)

    encodings_to_try = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252']
    selected_encoding = None
    for encoding in encodings_to_try:
        try:
            with open(csv_file_path, 'r', encoding=encoding, newline='') as f:
                f.read(1024)
            selected_encoding = encoding
            break
        except UnicodeDecodeError:
            continue
        except Exception as e:
            print(json.dumps({"status": "error", "message": f"Upload failed: An unexpected error occurred during encoding detection."}), file=sys.stdout)
            sys.exit(1)

    if selected_encoding is None:
        print(json.dumps({"status": "error", "message": "Upload failed: Invalid CSV encoding."}), file=sys.stdout)
        sys.exit(1)

    total_rows_processed = 0
    total_rows_skipped = 0
    validation_errors_found = False

    try:
        with open(csv_file_path, newline='', encoding=selected_encoding) as csvfile:
            reader = csv.DictReader(csvfile)
            if not reader.fieldnames:
                print(json.dumps({"status": "error", "message": "Upload failed: Missing CSV headers."}), file=sys.stdout)
                sys.exit(1)

            required_fields = ['First Name', 'Last Name', 'Email', 'Gender', 'Status']

            for i, row in enumerate(reader):
                try:
                    missing_fields = [field for field in required_fields if not row.get(field, '').strip()]
                    if missing_fields:
                        total_rows_skipped += 1
                        validation_errors_found = True
                        continue

                    first_name = row.get('First Name', '').strip()
                    last_name = row.get('Last Name', '').strip()
                    email = row.get('Email', '').strip()
                    gender = row.get('Gender', '').strip()
                    enrollment_status = row.get('Status', '').strip()
                    year_level_raw = row.get('Year Level', '').strip()

                    sex = parse_sex(gender)
                    if sex is None and gender.strip() != '':
                        total_rows_skipped += 1
                        validation_errors_found = True
                        continue

                    auth_user_id = None
                    temp_password = "password123"

                    try:
                        auth_response = supabase.auth.admin.create_user(
                            {
                                "email": email,
                                "password": temp_password,
                                "email_confirm": True,
                                "user_metadata": {
                                    "first_name": first_name,
                                    "last_name": last_name,
                                    "role": "R01"
                                }
                            }
                        )
                        if auth_response.user:
                            auth_user_id = auth_response.user.id
                        elif auth_response.error:
                            pass # Attempt to retrieve existing user ID below
                    except Exception as e:
                        pass # Attempt to retrieve existing user ID below

                    if not auth_user_id:
                        try:
                            existing_users = supabase.auth.admin.list_users()
                            if isinstance(existing_users, list) and existing_users:
                                found_user = next((u for u in existing_users if u.email == email), None)
                                if found_user:
                                    auth_user_id = found_user.id
                                else:
                                    total_rows_skipped += 1
                                    validation_errors_found = True
                                    continue
                            else:
                                total_rows_skipped += 1
                                validation_errors_found = True
                                continue
                        except Exception as list_e:
                            total_rows_skipped += 1
                            validation_errors_found = True
                            continue

                    if not auth_user_id:
                        total_rows_skipped += 1
                        validation_errors_found = True
                        continue

                    user_data = {
                        "auth_user_id": auth_user_id,
                        "first_name": first_name,
                        "last_name": last_name,
                        "email": email,
                        "sex": sex,
                        "role": "R01",
                    }
                    try:
                        user_response = supabase.table('users').upsert(user_data, on_conflict='auth_user_id').execute()
                        total_rows_processed += 1
                    except Exception as upsert_e:
                        total_rows_skipped += 1
                        validation_errors_found = True
                        continue

                except KeyError as e:
                    total_rows_skipped += 1
                    validation_errors_found = True
                except Exception as e:
                    total_rows_skipped += 1
                    validation_errors_found = True

    except csv.Error as e:
        print(json.dumps({"status": "error", "message": "Upload failed: CSV format error."}), file=sys.stdout)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"status": "error", "message": "Upload failed: An unexpected error occurred."}), file=sys.stdout)
        sys.exit(1)

    if validation_errors_found or total_rows_processed == 0:
        if total_rows_processed > 0:
            print(json.dumps({"status": "partial_success", "message": f"Import completed with some errors. {total_rows_processed} rows processed, {total_rows_skipped} skipped."}), file=sys.stdout)
        else:
            print(json.dumps({"status": "error", "message": "Upload failed: No valid data found in CSV."}), file=sys.stdout)
    else:
        print(json.dumps({"status": "success", "message": "Import has been successful."}), file=sys.stdout)

if __name__ == "__main__":
    main()
