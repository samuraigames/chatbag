/*
  # Performance Optimization Migration

  1. Indexes
    - Add composite index for messages with sender info
    - Add index for user searches using GIN
    - Optimize chat participant queries
    - Add performance indexes for common queries

  2. Database Settings
    - Set optimized timeout settings
    - Configure memory settings for better performance
    - Update table statistics

  3. Notes
    - Removed time-based partial indexes to avoid immutable function errors
    - Uses standard indexes that will still provide good performance
*/

-- Add composite index for messages with sender info
CREATE INDEX IF NOT EXISTS idx_messages_chat_sender ON messages(chat_id, sender_id, created_at DESC);

-- Add index for recent messages (without time predicate to avoid immutable function error)
CREATE INDEX IF NOT EXISTS idx_messages_recent ON messages(chat_id, created_at DESC);

-- Add index for user searches using simple text matching
CREATE INDEX IF NOT EXISTS idx_users_name_search ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_username_search ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email_search ON users(email);

-- Add trigram indexes for better text search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_users_name_trgm ON users USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON users USING gin(username gin_trgm_ops);

-- Optimize chat participant queries (without time predicate)
CREATE INDEX IF NOT EXISTS idx_chats_participants_gin ON chats USING gin(participants);

-- Add index for chat ordering
CREATE INDEX IF NOT EXISTS idx_chats_updated_desc ON chats(updated_at DESC);

-- Add index for message ordering within chats
CREATE INDEX IF NOT EXISTS idx_messages_chat_time ON messages(chat_id, created_at);

-- Add index for user activity
CREATE INDEX IF NOT EXISTS idx_users_last_active_desc ON users(last_active DESC);

-- Set optimized timeout settings
DO $$
BEGIN
  -- Set statement timeout
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET statement_timeout = ''15s''';
  
  -- Set idle transaction timeout
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET idle_in_transaction_session_timeout = ''30s''';
  
  -- Set lock timeout
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET lock_timeout = ''10s''';
  
  -- Optimize work memory
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET work_mem = ''8MB''';
  
  -- Set maintenance work memory
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET maintenance_work_mem = ''64MB''';
  
  -- Set effective cache size
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET effective_cache_size = ''256MB''';
  
  -- Set random page cost for SSD optimization
  EXECUTE 'ALTER DATABASE ' || current_database() || ' SET random_page_cost = ''1.1''';
  
EXCEPTION
  WHEN insufficient_privilege THEN
    -- If we can't modify database settings, just continue
    RAISE NOTICE 'Could not modify database settings due to insufficient privileges';
END $$;

-- Apply settings to current session
SET statement_timeout = '15s';
SET idle_in_transaction_session_timeout = '30s';
SET lock_timeout = '10s';
SET work_mem = '8MB';

-- Update table statistics for better query planning
ANALYZE users;
ANALYZE chats;
ANALYZE messages;

-- Create a function to clean up old data (optional, for future use)
CREATE OR REPLACE FUNCTION cleanup_old_messages()
RETURNS void AS $$
BEGIN
  -- This function can be called periodically to clean up very old messages
  -- Currently just a placeholder for future optimization
  RAISE NOTICE 'Cleanup function created successfully';
END;
$$ LANGUAGE plpgsql;