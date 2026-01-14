SELECT 
  'Database Connection' as check_type,
  '✅ Connected' as status,
  current_database() as database_name,
  current_user as user_name,
  version() as postgres_version;