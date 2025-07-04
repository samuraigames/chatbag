/*
  # Increase Statement Timeout for Better Performance

  1. Configuration Changes
    - Set statement_timeout to 60 seconds for better query performance
    - Set idle_in_transaction_session_timeout to prevent hanging connections
    - Optimize query performance settings

  2. Performance Improvements
    - Increase work_mem for better query performance
    - Set effective_cache_size for better planning

  3. Notes
    - These settings help prevent timeout errors during message fetching
    - Particularly important for real-time messaging applications
*/

-- Set statement timeout to 60 seconds to prevent query cancellation
ALTER DATABASE postgres SET statement_timeout = '60s';

-- Set idle transaction timeout to prevent hanging connections
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '120s';

-- Optimize query performance settings
ALTER DATABASE postgres SET work_mem = '16MB';
ALTER DATABASE postgres SET effective_cache_size = '1GB';

-- Set lock timeout to prevent deadlocks
ALTER DATABASE postgres SET lock_timeout = '30s';

-- Apply settings to current session
SET statement_timeout = '60s';
SET idle_in_transaction_session_timeout = '120s';
SET work_mem = '16MB';
SET lock_timeout = '30s';