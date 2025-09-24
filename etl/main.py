import csv
import os
import sys
from datetime import datetime, timezone
from supabase import create_client, Client
import uuid # Import uuid for generating temporary passwords
import certifi

os.environ['REQUESTS_CA_BUNDLE'] = certifi.where()
os.environ['CURL_CA_BUNDLE'] = certifi.where()

# Read Supabase URL and Key from command-line arguments
if len(sys.argv) < 5:  # Now expecting academic year ID as 4th argument
  print("Error: Missing command-line arguments for Supabase URL, Key, or Academic Year ID.", file=sys.stderr)
  sys.exit(1)

SUPABASE_URL = sys.argv[2]
SUPABASE_KEY = sys.argv[3]
ACADEMIC_YEAR_ID = sys.argv[4]  # Added academic year ID parameter

# DEBUG: Print first 5 chars of SUPABASE_KEY
if SUPABASE_KEY:
  print(f"DEBUG: SUPABASE_KEY (first 5 chars): {SUPABASE_KEY[:5]}")
else:
  print("DEBUG: SUPABASE_KEY NOT SET (This should not happen if args are passed)")

# Ensure environment variables are loaded (though now from args)
if not SUPABASE_URL or not SUPABASE_KEY or not ACADEMIC_YEAR_ID:
  print("Error: Supabase URL, Key, or Academic Year ID not found from command-line arguments.", file=sys.stderr)
  sys.exit(1)

try:
    # Using environment variables for SSL certificates
    print(f"DEBUG: Using SSL certificates from: {certifi.where()}")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("DEBUG: Supabase client created successfully")
except Exception as e:
    print(f"Error creating Supabase client: {e}", file=sys.stderr)
    sys.exit(1)

def get_academic_year_status(academic_year_id: str) -> str:
    """
    Get the status of an academic year by ID.
    Returns 'Active' or 'Inactive'
    """
    try:
        response = supabase.table('academic_years').select('status').eq('id', academic_year_id).single().execute()
        if response.data:
            return response.data.get('status', 'Inactive')
        else:
            print(f"WARNING: Academic year {academic_year_id} not found, defaulting to Inactive", file=sys.stderr)
            return 'Inactive'
    except Exception as e:
        print(f"ERROR: Failed to get academic year status for {academic_year_id}: {e}", file=sys.stderr)
        return 'Inactive'  # Default to inactive on error

def parse_year_level(raw: str) -> str | None:
  """
  Parses year level string to match expected format (e.g., '5th Year', '6th Year').
  If input is '5' or '6', it will convert to '5th Year' or '6th Year'.
  """
  raw_lower = raw.lower().strip()
  if "5th" in raw_lower or raw_lower == "5":
      return "5th Year"
  if "6th" in raw_lower or raw_lower == "6":
      return "6th Year"
  return raw if raw else None # Fallback for other values or empty string

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
      return 'Not Enrolled'  # Default fallback

def get_or_create_auth_user(email: str):
    """
    Try to create a new auth user, or get existing one if already exists.
    Returns (auth_user_id, created_new_user)
    """
    temp_password = str(uuid.uuid4())
    
    auth_user_id = None
    created_new_user = False

    # Attempt to find existing user first by listing all users
    try:
        response_from_list_users = supabase.auth.admin.list_users() 
        
        users_list = []
        # Check if the response has a 'data' attribute and it's a list (standard Supabase client response)
        if hasattr(response_from_list_users, 'data') and isinstance(response_from_list_users.data, list):
            users_list = response_from_list_users.data
            print(f"DEBUG: list_users() returned object with .data for {email}.")
        # If not, check if the response itself is a list (observed in some environments/versions)
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
                "password": temp_password,
                "email_confirm": True,
            })
            if new_auth_user_response.user:
                auth_user_id = new_auth_user_response.user.id
                created_new_user = True
                print(f"  Successfully created new auth user: {email} with ID: {auth_user_id}")
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
  
  academic_year_status = get_academic_year_status(ACADEMIC_YEAR_ID)
  target_table = 'clinicians' if academic_year_status != 'Inactive' else 'clinicians_records'
  print(f"Academic year status: {academic_year_status}, Target table: {target_table}")
  
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
                  if not all([student_id, first_name, last_name, email, gender, enrollment_status]):
                      print(f"  Skipping row {row_num} due to missing required data. Check CSV columns and data.", file=sys.stderr)
                      skipped_count += 1
                      continue
                  
                  # Parse and format data
                  parsed_gender = parse_sex(gender)
                  parsed_year_level = parse_year_level(year_level_raw)
                  parsed_enrollment_status = parse_enrollment_status(enrollment_status)

                  # Get or create auth user
                  auth_user_id, created_new_user = get_or_create_auth_user(email)
                  
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
                      "role": "R01", # clinician role
                      "contact_number": contact_number if contact_number else None,
                  }

                  # Check if user exists in public.users using .limit(1)
                  try:
                      user_response = supabase.table('users').select('auth_user_id').eq('auth_user_id', auth_user_id).limit(1).execute()
                      
                      if user_response.data:
                          # User exists, update it
                          print(f"  User with auth_user_id {auth_user_id} found in public.users. Attempting update.")
                          update_user_response = supabase.table('users').update(user_payload).eq('auth_user_id', auth_user_id).execute()
                          if update_user_response.data:
                              print(f"  Successfully updated user {first_name} {last_name} in public.users.")
                          else:
                              raise Exception(f"Failed to update user in public.users: {update_user_response.error.message}. Payload: {user_payload}")
                      else:
                          # User does not exist, insert it
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
                      "updated_at": datetime.now(timezone.utc).isoformat(),
                  }

                  # Add academic_year_id for clinicians_records table
                  if target_table == 'clinicians_records':
                      clinician_payload["academic_year_id"] = ACADEMIC_YEAR_ID

                  # Check if clinician exists in target table using .limit(1)
                  try:
                      clinician_response = supabase.table(target_table).select('user_id').eq('user_id', auth_user_id).limit(1).execute()

                      if clinician_response.data:
                          # Clinician exists, update it
                          print(f"  Clinician with user_id {auth_user_id} found in {target_table}. Attempting update.")
                          update_clinician_response = supabase.table(target_table).update(clinician_payload).eq('user_id', auth_user_id).execute()
                          if update_clinician_response.data:
                              print(f"  Successfully updated clinician {first_name} {last_name} in {target_table}.")
                          else:
                              raise Exception(f"Failed to update clinician in {target_table}: {update_clinician_response.error.message}. Payload: {clinician_payload}")
                      else:
                          # Clinician does not exist, insert it
                          print(f"  Clinician with user_id {auth_user_id} not found in {target_table}. Attempting insert.")
                          insert_clinician_response = supabase.table(target_table).insert([clinician_payload]).execute()
                          if insert_clinician_response.data:
                              print(f"  Successfully inserted clinician {first_name} {last_name} into {target_table}.")
                          else:
                              raise Exception(f"Failed to insert clinician into {target_table}: {insert_clinician_response.error.message}. Payload: {clinician_payload}")
                  except Exception as db_error:
                      print(f"  Database operation error for {target_table} (user_id: {auth_user_id}): {db_error}", file=sys.stderr)
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
