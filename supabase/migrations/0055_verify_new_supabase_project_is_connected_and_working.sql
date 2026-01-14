SELECT 
  'Database Connection Test' as test,
  current_database() as database,
  current_user as user,
  '✅ Connected to NEW project' as status;