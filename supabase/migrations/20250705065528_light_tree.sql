/*
  # Optimize Database Performance

  1. Performance Improvements
    - Add additional indexes for faster queries
    - Optimize existing indexes
    - Set better timeout configurations

  2. New Indexes
    - Composite indexes for common query patterns
    - Partial indexes for better performance

  3. Configuration
    - Optimize statement timeout
    - Improve query performance settings
*/

-- Add composite index for messages with sender info
CREATE INDEX IF NOT EXISTS idx_messages_chat_sender ON messages(chat_id, sender_id, created_at DESC);

-- Add partial index for recent messages (last 30 days)
CREATE INDEX IF NOT EXISTS idx_messages_recent ON messages(chat_id, created_at DESC) 
WHERE created_at > (now() - interval '30 days');

-- Add index for user searches
CREATE INDEX IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector('english', name || ' ' || username || ' ' || email));

-- Optimize chat participant queries
CREATE INDEX IF NOT EXISTS idx_chats_participants_updated ON chats USING gin(participants) 
WHERE updated_at > (now() - interval '7 days');

-- Set optimized timeout settings
ALTER DATABASE postgres SET statement_timeout = '15s';
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '30s';
ALTER DATABASE postgres SET lock_timeout = '10s';

-- Optimize work memory for better query performance
ALTER DATABASE postgres SET work_mem = '8MB';
ALTER DATABASE postgres SET maintenance_work_mem = '64MB';

-- Apply settings to current session
SET statement_timeout = '15s';
SET idle_in_transaction_session_timeout = '30s';
SET lock_timeout = '10s';
SET work_mem = '8MB';

-- Analyze tables to update statistics
ANALYZE users;
ANALYZE chats;
ANALYZE messages;