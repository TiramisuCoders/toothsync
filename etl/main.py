import csv
import os
import sys
from datetime import datetime, timezone
from supabase import create_client, Client
import uuid # Import uuid for generating temporary passwords

# Read Supabase URL and Key from command-line arguments
if len(sys.argv) < 4:
  print("Error: Missing command-line arguments for Supabase URL or Key.", file=sys.stderr)
  sys.exit(1)

SUPABASE_URL = sys.argv[2]
SUPABASE_KEY = sys.argv[3]

# DEBUG: Print first 5 chars of SUPABASE_KEY
if SUPABASE_KEY:
  print(f"DEBUG: SUPABASE_KEY (first 5 chars): {SUPABASE_KEY[:5]}")
else:
  print("DEBUG: SUPABASE_KEY NOT SET (This should not happen if args are passed)")

# Ensure environment variables are loaded (though now from args)
if not SUPABASE_URL or not SUPABASE_KEY:
  print("Error: Supabase URL or Key not found from command-line arguments.", file=sys.stderr)
  sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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

def parse_birthday(birthday_str: str) -> str | None:
  """
  Parses a birthday string into ISO 8601 format (YYYY-MM-DD).
  Handles common formats like YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY.
  """
  if not birthday_str:
      return None
  
  formats = [
      "%Y-%m-%d", # 2023-01-15
      "%m/%d/%Y", # 01/15/2023
      "%d/%m/%Y", # 15/01/2023
      "%Y%m%d",   # 20230115
  ]
  
  for fmt in formats:
      try:
          dt_obj = datetime.strptime(birthday_str, fmt)
          return dt_obj.isoformat().split('T')[0] # Return only date part
      except ValueError:
          continue
  
  print(f"WARNING: Could not parse birthday '{birthday_str}'. Storing as None.", file=sys.stderr)
  return None

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
            # This case means the response is neither a direct list nor an object with a .data list.
            # This is an unexpected response format, so we log it and proceed to try creating a new user.
            print(f"WARNING: Unexpected response format from list_users() for {email}. Type: {type(response_from_list_users)}. Response: {response_from_list_users}", file=sys.stderr)
            users_list = [] # Ensure it's an empty list to prevent errors in the loop below

        for user in users_list:
            # Ensure the user object itself has an 'id' and 'email' attribute before accessing them
            if hasattr(user, 'id') and hasattr(user, 'email') and user.email == email:
                auth_user_id = user.id
                created_new_user = False
                print(f"  Found existing auth user: {email} with ID: {auth_user_id}")
                break # Found user, exit loop

    except AttributeError as e:
        # This specific error indicates that an attribute access failed, likely within the Supabase client's
        # internal handling of list_users() if it received an unexpected response format (e.g., a raw list
        # when it expected an object with .data).
        print(f"  AttributeError when listing users for {email}: {e}. This suggests an issue with the Supabase client's response parsing.", file=sys.stderr)
        # auth_user_id remains None, so we will proceed to try creating a new user.
    except Exception as e:
        # Catch any other unexpected errors during user listing
        print(f"  General error listing existing users for {email}: {e}", file=sys.stderr)
        # auth_user_id remains None, so we will proceed to try creating a new user.

    # If auth_user_id was not found by listing (either because it doesn't exist or listing failed), try to create a new user
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
                # If creation failed, it might be because the user already exists (e.g., if listing failed silently)
                print(f"  Failed to create auth user for {email}: {new_auth_user_response.error.message}", file=sys.stderr)
                # If the error is "User already registered", try to retrieve the user again as a fallback.
                if "User already registered" in str(new_auth_user_response.error):
                    print(f"  User already registered, attempting to retrieve existing user by email for {email} as fallback...", file=sys.stderr)
                    try:
                        # This is the problematic call, but we try it again as a fallback.
                        # If it fails again, we'll log it and return None.
                        fallback_response = supabase.auth.admin.list_users()
                        fallback_users_list = []
                        if hasattr(fallback_response, 'data') and isinstance(fallback_response.data, list):
                            fallback_users_list = fallback_response.data
                        elif isinstance(fallback_response, list):
                            fallback_users_list = fallback_response
                        
                        for user in fallback_users_list:
                            if hasattr(user, 'id') and hasattr(user, 'email') and user.email == email:
                                auth_user_id = user.id
                                created_new_user = False
                                print(f"  Successfully retrieved existing auth user: {email} with ID: {auth_user_id} via fallback.")
                                break
                        if auth_user_id is None:
                            print(f"  Fallback: Could not retrieve existing user {email} even after 'User already registered' error.", file=sys.stderr)
                    except Exception as e_fallback:
                        print(f"  Fallback: Error retrieving existing user by email for {email}: {e_fallback}", file=sys.stderr)
                # If user creation failed and it's not a "user already registered" error, or fallback failed
                if auth_user_id is None:
                    return None, False 
        except Exception as e:
            print(f"  Auth user creation failed for {email}: {e}", file=sys.stderr)
            return None, False # Return None if an unexpected error occurred during creation

    return auth_user_id, created_new_user

def main():
  if len(sys.argv) < 2:
      print("Usage: python main.py <path_to_csv_file> <supabase_url> <supabase_key>", file=sys.stderr)
      sys.exit(1)
  
  csv_file_path = sys.argv[1]
  if not os.path.exists(csv_file_path):
      print(f"Error: CSV file not found at {csv_file_path}", file=sys.stderr)
      sys.exit(1)
  
  print(f"Processing CSV file: {csv_file_path}")
  
  # Try different encodings
  encodings_to_try = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252']
  selected_encoding = None
  for encoding in encodings_to_try:
      try:
          with open(csv_file_path, 'r', encoding=encoding, newline='') as f:
              f.read(1024) # Read a small chunk to test encoding
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
              row_num = i + 2 # Account for header row and 0-based index
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
                  address = row.get('Address', '').strip()
                  birthday_str = row.get('Birthday', '').strip()
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
                  parsed_birthday = parse_birthday(birthday_str)

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
                      "birthday": parsed_birthday,
                      "contact_number": contact_number if contact_number else None,
                      "address": address if address else None,
                  }

                  # Check if user exists in public.users using .limit(1)
                  try:
                      user_response = supabase.table('users').select('auth_user_id').eq('auth_user_id', auth_user_id).limit(1).execute()
                      
                      if user_response.data: # Will be [] if not found, or [{...}] if found
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
                      raise # Re-raise to be caught by the outer try-except for row processing

                  # 2. Handle public.clinicians table (Insert or Update)
                  clinician_payload = {
                      "user_id": auth_user_id,
                      "student_id": student_id,
                      "enrollment_status": enrollment_status,
                      "year_level": parsed_year_level,
                      "section": section if section else None,
                      "updated_at": datetime.now(timezone.utc).isoformat(),
                  }

                  # Check if clinician exists in public.clinicians using .limit(1)
                  try:
                      clinician_response = supabase.table('clinicians').select('user_id').eq('user_id', auth_user_id).limit(1).execute()

                      if clinician_response.data: # Will be [] if not found, or [{...}] if found
                          # Clinician exists, update it
                          print(f"  Clinician with user_id {auth_user_id} found in public.clinicians. Attempting update.")
                          update_clinician_response = supabase.table('clinicians').update(clinician_payload).eq('user_id', auth_user_id).execute()
                          if update_clinician_response.data:
                              print(f"  Successfully updated clinician {first_name} {last_name}.")
                          else:
                              raise Exception(f"Failed to update clinician: {update_clinician_response.error.message}. Payload: {clinician_payload}")
                      else:
                          # Clinician does not exist, insert it
                          print(f"  Clinician with user_id {auth_user_id} not found in public.clinicians. Attempting insert.")
                          insert_clinician_response = supabase.table('clinicians').insert([clinician_payload]).execute()
                          if insert_clinician_response.data:
                              print(f"  Successfully inserted clinician {first_name} {last_name}.")
                          else:
                              raise Exception(f"Failed to insert clinician: {insert_clinician_response.error.message}. Payload: {clinician_payload}")
                  except Exception as db_error:
                      print(f"  Database operation error for public.clinicians (user_id: {auth_user_id}): {db_error}", file=sys.stderr)
                      raise # Re-raise to be caught by the outer try-except for row processing

                  processed_count += 1

              except KeyError as e:
                  print(f"Error processing row {row_num}: Missing expected column in CSV: {e}. Row: {row}", file=sys.stderr)
                  skipped_count += 1
              except Exception as e:
                  print(f"An unexpected error occurred processing row {row_num} {row}: {e}", file=sys.stderr)
                  skipped_count += 1
      
      print(f"Finished processing CSV. Total clinicians processed: {processed_count}, Skipped: {skipped_count}")
      if skipped_count > 0:
          sys.exit(1) # Indicate partial success/failure
      sys.exit(0) # Indicate full success

  except csv.Error as e:
      print(f"CSV parsing error: {e}", file=sys.stderr)
      sys.exit(1)
  except Exception as e:
      print(f"An error occurred during CSV processing: {e}", file=sys.stderr)
      sys.exit(1)

if __name__ == "__main__":
  main()
