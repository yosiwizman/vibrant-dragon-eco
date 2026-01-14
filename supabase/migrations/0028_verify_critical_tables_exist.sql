SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN '✅' ELSE '❌ MISSING' END as profiles,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tasks') THEN '✅' ELSE '❌ MISSING' END as tasks,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reminders') THEN '✅' ELSE '❌ MISSING' END as reminders,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'notes') THEN '✅' ELSE '❌ MISSING' END as notes,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_widgets') THEN '✅' ELSE '❌ MISSING' END as user_widgets,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'contacts') THEN '✅' ELSE '❌ MISSING' END as contacts,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'appointments') THEN '✅' ELSE '❌ MISSING' END as appointments,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'knowledge') THEN '✅' ELSE '❌ MISSING' END as knowledge;