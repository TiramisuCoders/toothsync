import csv
import os
import sys
from datetime import datetime, timezone
from supabase import create_client, Client
import certifi

os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
os.environ['CURL_CA_BUNDLE'] = certifi.where()

# Read Supabase URL and Key from command-line arguments
if len(sys.argv) < 5:
  print("Error: Missing command-line arguments for Supabase URL, Key, or Academic Year ID.", file=sys.stderr)
  sys.exit(1)

SUPABASE_URL = sys.argv[2]
SUPABASE_KEY = sys.argv[3]
ACADEMIC_YEAR_ID = sys.argv[4]

# DEBUG: Print first 5 chars of SUPABASE_KEY
if SUPABASE_KEY:
  print(f"DEBUG: SUPABASE_KEY (first 5 chars): {SUPABASE_KEY[:5]}")
else:
  print("DEBUG: SUPABASE_KEY NOT SET (This should not happen if args are passed)")

# Ensure environment variables are loaded
if not SUPABASE_URL or not SUPABASE_KEY or not ACADEMIC_YEAR_ID:
  print("Error: Supabase URL, Key, or Academic Year ID not found from command-line arguments.", file=sys.stderr)
  sys.exit(1)

try:
    print(f"DEBUG: Using SSL certificates from: {certifi.where()}")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("DEBUG: Supabase client created successfully")
except Exception as e:
    print(f"Error creating Supabase client: {e}", file=sys.stderr)
    sys.exit(1)

def generate_password(first_name: str, last_name: str, contact_number: str) -> str:
    """
    Generate password using: First Initial + Last Initial + Last 4 digits of contact number
    Example: John Doe with contact 09123456789 -> JD6789
    """
    first_initial = first_name[0].upper() if first_name else 'X'
    last_initial = last_name[0].upper() if last_name else 'X'
    # Remove all non-digit characters and get last 4 digits
    digits_only = ''.join(filter(str.isdigit, contact_number))
    last_four = digits_only[-4:] if len(digits_only) >= 4 else digits_only.zfill(4)
    return f"{first_initial}{last_initial}{last_four}"


def parse_sex(gender: str) -> str:
  """Return full words to match database constraint (Male, Female, Other)"""
  gender_lower = gender.lower().strip()
  if gender_lower == 'male':
      return 'Male'
  elif gender_lower == 'female':
      return 'Female'
  else:
      return 'Other'

def parse_enrollment_status(status: str) -> str:
  """Parse enrollment status to match database enum values"""
  status_lower = status.lower().strip()
  if status_lower in ['enrolled', 'active', 'current']:
      return 'Enrolled'
  elif status_lower in ['not-enrolled', 'not enrolled', 'inactive', 'dropped']:
      return 'Not Enrolled'
  else:
      return 'Not Enrolled'

def get_or_create_auth_user(email: str, password: str):
    """
    Try to create a new auth user with the provided password, or get existing one if already exists.
    Returns (auth_user_id, created_new_user)
    """
    auth_user_id = None
    created_new_user = False

    # Attempt to find existing user first by listing all users
    try:
        response_from_list_users = supabase.auth.admin.list_users() 
        
        users_list = []
        if hasattr(response_from_list_users, 'data') and isinstance(response_from_list_users.data, list):
            users_list = response_from_list_users.data
            print(f"DEBUG: list_users() returned object with .data for {email}.")
        elif isinstance(response_from_list_users, list):
            users_list = response_from_list_users
            print(f"DEBUG: list_users() returned a direct list for {email}.")
        else:
            print(f"WARNING: Unexpected response format from list_users() for {email}. Type: {type(response_from_list_users)}. Response: {response_from_list_users}", file=sys.stderr)
            users_list = []

        for user in users_list:
            if hasattr(user, 'id') and hasattr(user, 'email') and user.email == email:
                auth_user_id = user.id
                created_new_user = False
                print(f"  Found existing auth user: {email} with ID: {auth_user_id}")
                break

    except Exception as e:
        print(f"  Error listing existing users for {email}: {e}", file=sys.stderr)

    # If auth_user_id was not found, try to create a new user
    if auth_user_id is None:
        try:
            new_auth_user_response = supabase.auth.admin.create_user({
                "email": email,
                "password": password,
                "email_confirm": True,
            })
            if new_auth_user_response.user:
                auth_user_id = new_auth_user_response.user.id
                created_new_user = True
                print(f"  Successfully created new auth user: {email} with ID: {auth_user_id} and password: {password}")
            else:
                print(f"  Failed to create auth user for {email}: {new_auth_user_response.error.message}", file=sys.stderr)
                return None, False
        except Exception as e:
            print(f"  Auth user creation failed for {email}: {e}", file=sys.stderr)
            return None, False

    return auth_user_id, created_new_user

def main():
  if len(sys.argv) < 2:
      print("Usage: python main.py <path_to_csv_file> <supabase_url> <supabase_key> <academic_year_id>", file=sys.stderr)
      sys.exit(1)
  
  csv_file_path = sys.argv[1]
  if not os.path.exists(csv_file_path):
      print(f"Error: CSV file not found at {csv_file_path}", file=sys.stderr)
      sys.exit(1)
  
  print(f"Processing CSV file: {csv_file_path}")
  print(f"Academic year ID: {ACADEMIC_YEAR_ID}")
  
  # Try different encodings
  encodings_to_try = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252']
  selected_encoding = None
  for encoding in encodings_to_try:
      try:
          with open(csv_file_path, 'r', encoding=encoding, newline='') as f:
              f.read(1024)
          selected_encoding = encoding
          print(f"Successfully identified CSV encoding: {encoding}")
          break
      except UnicodeDecodeError:
          print(f"Failed to read with encoding {encoding}, trying next...", file=sys.stderr)
          continue
      except Exception as e:
          print(f"An unexpected error occurred while trying encoding {encoding}: {e}", file=sys.stderr)
          sys.exit(1)
          
  if selected_encoding is None:
      print("Error: Could not decode CSV file with any of the tried encodings.", file=sys.stderr)
      sys.exit(1)

  processed_count = 0
  skipped_count = 0
  
  try:
      with open(csv_file_path, newline='', encoding=selected_encoding) as csvfile:
          reader = csv.DictReader(csvfile)
          if reader.fieldnames:
              print(f"CSV Headers detected: {reader.fieldnames}")
          else:
              print("WARNING: No CSV headers detected. This might cause issues.", file=sys.stderr)
          
          for i, row in enumerate(reader):
              row_num = i + 2
              print(f"Processing row {row_num}: {row}")
              try:
                  # Extract and clean data from CSV row
                  student_id = row.get('Student ID', '').strip()
                  first_name = row.get('First Name', '').strip()
                  last_name = row.get('Last Name', '').strip()
                  email = row.get('Email', '').strip()
                  gender = row.get('Gender', '').strip()
                  enrollment_status = row.get('Status', '').strip()
                  year_level_raw = row.get('Year Level', '').strip()
                  contact_number = row.get('Contact Number', '').strip()
                  section = row.get('Section', '').strip()

                  print(f"  Values for validation: Student ID='{student_id}', First Name='{first_name}', Email='{email}', Gender='{gender}', Status='{enrollment_status}'")
                  
                  # Basic validation for required fields
                  if not all([student_id, first_name, last_name, email, gender, enrollment_status, contact_number]):
                      print(f"  Skipping row {row_num} due to missing required data. Check CSV columns and data.", file=sys.stderr)
                      skipped_count += 1
                      continue
                  
                  # Parse and format data
                  parsed_gender = parse_sex(gender)
                  parsed_year_level = parse_year_level(year_level_raw)
                  parsed_enrollment_status = parse_enrollment_status(enrollment_status)

                  generated_password = generate_password(first_name, last_name, contact_number)
                  print(f"  Generated password for {first_name} {last_name}: {generated_password}")

                  # Get or create auth user with generated password
                  auth_user_id, created_new_user = get_or_create_auth_user(email, generated_password)
                  
                  if not auth_user_id:
                      print(f"  Could not obtain auth_user_id for {email}. Skipping row {row_num}.", file=sys.stderr)
                      skipped_count += 1
                      continue

                  # 1. Handle public.users table (Insert or Update)
                  user_payload = {
                      "auth_user_id": auth_user_id,
                      "first_name": first_name,
                      "last_name": last_name,
                      "email": email,
                      "sex": parsed_gender,
                      "role": "R01",
                      "contact_number": contact_number if contact_number else None,
                  }

                  try:
                      user_response = supabase.table('users').select('auth_user_id').eq('auth_user_id', auth_user_id).limit(1).execute()
                      
                      if user_response.data:
                          print(f"  User with auth_user_id {auth_user_id} found in public.users. Attempting update.")
                          update_user_response = supabase.table('users').update(user_payload).eq('auth_user_id', auth_user_id).execute()
                          if update_user_response.data:
                              print(f"  Successfully updated user {first_name} {last_name} in public.users.")
                          else:
                              raise Exception(f"Failed to update user in public.users: {update_user_response.error.message}. Payload: {user_payload}")
                      else:
                          print(f"  User with auth_user_id {auth_user_id} not found in public.users. Attempting insert.")
                          insert_user_response = supabase.table('users').insert([user_payload]).execute()
                          if insert_user_response.data:
                              print(f"  Successfully inserted user {first_name} {last_name} into public.users.")
                          else:
                              raise Exception(f"Failed to insert user into public.users: {insert_user_response.error.message}. Payload: {user_payload}")
                  except Exception as db_error:
                      print(f"  Database operation error for public.users (auth_user_id: {auth_user_id}): {db_error}", file=sys.stderr)
                      raise

                  clinician_payload = {
                      "user_id": auth_user_id,
                      "student_id": student_id,
                      "enrollment_status": parsed_enrollment_status,
                      "year_level": parsed_year_level,
                      "section": section if section else None,
                      "academic_year_id": ACADEMIC_YEAR_ID,
                      "updated_at": datetime.now(timezone.utc).isoformat(),
                  }

                  try:
                      clinician_response = supabase.table('clinicians').select('user_id').eq('user_id', auth_user_id).limit(1).execute()

                      if clinician_response.data:
                          print(f"  Clinician with user_id {auth_user_id} found in clinicians. Attempting update.")
                          update_clinician_response = supabase.table('clinicians').update(clinician_payload).eq('user_id', auth_user_id).execute()
                          if update_clinician_response.data:
                              print(f"  Successfully updated clinician {first_name} {last_name} in clinicians.")
                          else:
                              raise Exception(f"Failed to update clinician in clinicians: {update_clinician_response.error.message}. Payload: {clinician_payload}")
                      else:
                          print(f"  Clinician with user_id {auth_user_id} not found in clinicians. Attempting insert.")
                          insert_clinician_response = supabase.table('clinicians').insert([clinician_payload]).execute()
                          if insert_clinician_response.data:
                              print(f"  Successfully inserted clinician {first_name} {last_name} into clinicians.")
                          else:
                              raise Exception(f"Failed to insert clinician into clinicians: {insert_clinician_response.error.message}. Payload: {clinician_payload}")
                  except Exception as db_error:
                      print(f"  Database operation error for clinicians (user_id: {auth_user_id}): {db_error}", file=sys.stderr)
                      raise

                  clinician_record_payload = {
                      "user_id": auth_user_id,
                      "academic_year_id": ACADEMIC_YEAR_ID,
                      "student_id": student_id,
                      "year_level": parsed_year_level,
                      "section": section if section else None,
                      "created_at": datetime.now(timezone.utc).isoformat(),
                  }

                  try:
                      # Check if record already exists for this user and academic year
                      record_response = supabase.table('clinician_records').select('user_id').eq('user_id', auth_user_id).eq('academic_year_id', ACADEMIC_YEAR_ID).limit(1).execute()

                      if record_response.data:
                          print(f"  Clinician record with user_id {auth_user_id} found in clinician_records for academic year {ACADEMIC_YEAR_ID}. Skipping duplicate.")
                      else:
                          print(f"  Inserting clinician record for {first_name} {last_name} into clinician_records.")
                          insert_record_response = supabase.table('clinician_records').insert([clinician_record_payload]).execute()
                          if insert_record_response.data:
                              print(f"  Successfully inserted clinician record {first_name} {last_name} into clinician_records.")
                          else:
                              raise Exception(f"Failed to insert clinician record into clinician_records: {insert_record_response.error.message}. Payload: {clinician_record_payload}")
                  except Exception as db_error:
                      print(f"  Database operation error for clinician_records (user_id: {auth_user_id}): {db_error}", file=sys.stderr)
                      raise

                  processed_count += 1

              except KeyError as e:
                  print(f"Error processing row {row_num}: Missing expected column in CSV: {e}. Row: {row}", file=sys.stderr)
                  skipped_count += 1
              except Exception as e:
                  print(f"An unexpected error occurred processing row {row_num} {row}: {e}", file=sys.stderr)
                  skipped_count += 1
      
      print(f"Finished processing CSV. Total clinicians processed: {processed_count}, Skipped: {skipped_count}")
      if skipped_count > 0:
          sys.exit(1)
      sys.exit(0)

  except csv.Error as e:
      print(f"CSV parsing error: {e}", file=sys.stderr)
      sys.exit(1)
  except Exception as e:
      print(f"An error occurred during CSV processing: {e}", file=sys.stderr)
      sys.exit(1)

if __name__ == "__main__":
  main()
