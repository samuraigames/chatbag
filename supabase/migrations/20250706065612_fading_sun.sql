/*
  # Enhanced Chat Features Migration

  1. New Tables
    - `message_reactions` - Emoji reactions to messages
    - `message_attachments` - File attachments for messages  
    - `user_presence` - Online/offline status tracking
    - `chat_settings` - Per-user chat preferences
    - `message_threads` - Message threading/replies
    - `user_blocks` - User blocking functionality
    - `message_status` - Message delivery/read status

  2. Enhanced Features
    - Message reactions with emoji support
    - File attachment system
    - Real-time presence tracking
    - Unread message counts
    - Message search functionality
    - User blocking system
    - Chat-specific settings

  3. Security
    - Enable RLS on all new tables
    - Comprehensive policies for data access
    - Secure functions for common operations
*/

-- Create enum types with proper error handling
DO $$ BEGIN
    CREATE TYPE reaction_type AS ENUM ('👍', '👎', '❤️', '😂', '😮', '😢', '😡');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE attachment_type AS ENUM ('image', 'file', 'video', 'audio');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE presence_status AS ENUM ('online', 'offline', 'away', 'busy');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE message_status_type AS ENUM ('sent', 'delivered', 'read');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reaction reaction_type NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id, reaction)
);

-- Message attachments table
CREATE TABLE IF NOT EXISTS message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  file_name text NOT NULL,
  file_size bigint NOT NULL,
  file_type attachment_type NOT NULL,
  file_url text NOT NULL,
  thumbnail_url text,
  created_at timestamptz DEFAULT now()
);

-- User presence table
CREATE TABLE IF NOT EXISTS user_presence (
  user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status presence_status DEFAULT 'offline',
  last_seen timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Chat settings table
CREATE TABLE IF NOT EXISTS chat_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  notifications_enabled boolean DEFAULT true,
  sound_enabled boolean DEFAULT true,
  muted_until timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(chat_id, user_id)
);

-- Message threads table
CREATE TABLE IF NOT EXISTS message_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  reply_message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(parent_message_id, reply_message_id)
);

-- User blocks table
CREATE TABLE IF NOT EXISTS user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  blocked_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK(blocker_id != blocked_id)
);

-- Message status tracking
CREATE TABLE IF NOT EXISTS message_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status message_status_type DEFAULT 'sent',
  updated_at timestamptz DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Add new columns to existing tables with proper checks
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'reply_to_id'
  ) THEN
    ALTER TABLE messages ADD COLUMN reply_to_id uuid REFERENCES messages(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'edited_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN edited_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chats' AND column_name = 'name'
  ) THEN
    ALTER TABLE chats ADD COLUMN name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chats' AND column_name = 'description'
  ) THEN
    ALTER TABLE chats ADD COLUMN description text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chats' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE chats ADD COLUMN avatar_url text;
  END IF;
END $$;

-- Enable RLS on all new tables
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies for message_reactions
DO $$ BEGIN
  CREATE POLICY "Users can read reactions in their chats"
    ON message_reactions
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM messages m
        JOIN chats c ON c.id = m.chat_id
        WHERE m.id = message_reactions.message_id
        AND auth.uid() = ANY(c.participants)
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can add reactions to messages in their chats"
    ON message_reactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
      auth.uid() = user_id
      AND EXISTS (
        SELECT 1 FROM messages m
        JOIN chats c ON c.id = m.chat_id
        WHERE m.id = message_reactions.message_id
        AND auth.uid() = ANY(c.participants)
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can remove their own reactions"
    ON message_reactions
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for message_attachments
DO $$ BEGIN
  CREATE POLICY "Users can read attachments in their chats"
    ON message_attachments
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM messages m
        JOIN chats c ON c.id = m.chat_id
        WHERE m.id = message_attachments.message_id
        AND auth.uid() = ANY(c.participants)
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can add attachments to their messages"
    ON message_attachments
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM messages m
        WHERE m.id = message_attachments.message_id
        AND m.sender_id = auth.uid()
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for user_presence
DO $$ BEGIN
  CREATE POLICY "Users can read all presence status"
    ON user_presence
    FOR SELECT
    TO authenticated
    USING (true);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update their own presence"
    ON user_presence
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for chat_settings
DO $$ BEGIN
  CREATE POLICY "Users can manage their own chat settings"
    ON chat_settings
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for message_threads
DO $$ BEGIN
  CREATE POLICY "Users can read threads in their chats"
    ON message_threads
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM messages m
        JOIN chats c ON c.id = m.chat_id
        WHERE m.id = message_threads.parent_message_id
        AND auth.uid() = ANY(c.participants)
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can create threads in their chats"
    ON message_threads
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM messages m
        JOIN chats c ON c.id = m.chat_id
        WHERE m.id = message_threads.parent_message_id
        AND auth.uid() = ANY(c.participants)
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for user_blocks
DO $$ BEGIN
  CREATE POLICY "Users can manage their own blocks"
    ON user_blocks
    FOR ALL
    TO authenticated
    USING (auth.uid() = blocker_id)
    WITH CHECK (auth.uid() = blocker_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- RLS Policies for message_status
DO $$ BEGIN
  CREATE POLICY "Users can read message status in their chats"
    ON message_status
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM messages m
        JOIN chats c ON c.id = m.chat_id
        WHERE m.id = message_status.message_id
        AND auth.uid() = ANY(c.participants)
      )
    );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE POLICY "Users can update message status for themselves"
    ON message_status
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON message_attachments(message_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_status ON user_presence(status);
CREATE INDEX IF NOT EXISTS idx_chat_settings_chat ON chat_settings(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_settings_user ON chat_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_parent ON message_threads(parent_message_id);
CREATE INDEX IF NOT EXISTS idx_message_threads_reply ON message_threads(reply_message_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON user_blocks(blocked_id);
CREATE INDEX IF NOT EXISTS idx_message_status_message ON message_status(message_id);
CREATE INDEX IF NOT EXISTS idx_message_status_user ON message_status(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_id);

-- Functions for enhanced features

-- Function to update user presence
CREATE OR REPLACE FUNCTION update_user_presence(status_param presence_status)
RETURNS void AS $$
BEGIN
  INSERT INTO user_presence (user_id, status, last_seen, updated_at)
  VALUES (auth.uid(), status_param, now(), now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    status = status_param,
    last_seen = now(),
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark messages as read
CREATE OR REPLACE FUNCTION mark_messages_as_read(chat_id_param uuid)
RETURNS void AS $$
BEGIN
  -- Update message status for all unread messages in the chat
  INSERT INTO message_status (message_id, user_id, status, updated_at)
  SELECT m.id, auth.uid(), 'read', now()
  FROM messages m
  WHERE m.chat_id = chat_id_param
    AND m.sender_id != auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM message_status ms
      WHERE ms.message_id = m.id
        AND ms.user_id = auth.uid()
        AND ms.status = 'read'
    )
  ON CONFLICT (message_id, user_id)
  DO UPDATE SET
    status = 'read',
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread message count
CREATE OR REPLACE FUNCTION get_unread_count(chat_id_param uuid)
RETURNS integer AS $$
DECLARE
  unread_count integer;
BEGIN
  SELECT COUNT(*)::integer INTO unread_count
  FROM messages m
  WHERE m.chat_id = chat_id_param
    AND m.sender_id != auth.uid()
    AND NOT EXISTS (
      SELECT 1 FROM message_status ms
      WHERE ms.message_id = m.id
        AND ms.user_id = auth.uid()
        AND ms.status = 'read'
    );
  
  RETURN COALESCE(unread_count, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search messages
CREATE OR REPLACE FUNCTION search_messages(
  search_query text,
  chat_id_param uuid DEFAULT NULL,
  limit_param integer DEFAULT 50
)
RETURNS TABLE (
  id uuid,
  content text,
  created_at timestamptz,
  sender_id uuid,
  chat_id uuid,
  sender_name text,
  chat_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    m.created_at,
    m.sender_id,
    m.chat_id,
    u.name as sender_name,
    COALESCE(c.name, 'Direct Message') as chat_name
  FROM messages m
  JOIN users u ON u.id = m.sender_id
  JOIN chats c ON c.id = m.chat_id
  WHERE 
    auth.uid() = ANY(c.participants)
    AND m.content ILIKE '%' || search_query || '%'
    AND (chat_id_param IS NULL OR m.chat_id = chat_id_param)
    AND m.deleted_at IS NULL
  ORDER BY m.created_at DESC
  LIMIT limit_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for automatic status updates

-- Function to handle new message status
CREATE OR REPLACE FUNCTION handle_new_message_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Mark message as delivered for all chat participants except sender
  INSERT INTO message_status (message_id, user_id, status, updated_at)
  SELECT NEW.id, unnest(c.participants), 'delivered', now()
  FROM chats c
  WHERE c.id = NEW.chat_id
    AND unnest(c.participants) != NEW.sender_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to handle user activity
CREATE OR REPLACE FUNCTION handle_user_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Update user presence to online when they send a message
  PERFORM update_user_presence('online');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers with existence checks
DO $$ BEGIN
  CREATE TRIGGER trigger_new_message_status
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_message_status();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TRIGGER trigger_user_activity_messages
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_user_activity();
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Initialize presence for existing users
INSERT INTO user_presence (user_id, status, last_seen, updated_at)
SELECT id, 'offline', last_active, now()
FROM users
ON CONFLICT (user_id) DO NOTHING;

-- Create a view for enhanced chat list with unread counts
CREATE OR REPLACE VIEW chat_list_with_unread AS
SELECT 
  c.*,
  get_unread_count(c.id) as unread_count,
  CASE 
    WHEN c.is_group THEN c.name
    ELSE (
      SELECT u.name 
      FROM users u 
      WHERE u.id = ANY(c.participants) 
        AND u.id != auth.uid() 
      LIMIT 1
    )
  END as display_name,
  CASE 
    WHEN c.is_group THEN c.avatar_url
    ELSE (
      SELECT u.avatar_url 
      FROM users u 
      WHERE u.id = ANY(c.participants) 
        AND u.id != auth.uid() 
      LIMIT 1
    )
  END as display_avatar
FROM chats c
WHERE auth.uid() = ANY(c.participants);

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION update_user_presence(presence_status) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_messages_as_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_unread_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION search_messages(text, uuid, integer) TO authenticated;
GRANT SELECT ON chat_list_with_unread TO authenticated;