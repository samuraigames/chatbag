/*
  # Add username column to users table

  1. New Columns
    - `username` (text, unique, not null)
      - Unique identifier for users
      - Generated from name + user ID for existing users
      - Required for new users

  2. Security
    - Maintains existing RLS policies
    - Adds index for efficient username searches

  3. Changes
    - Adds username column to users table
    - Populates existing users with generated usernames
    - Ensures uniqueness and not-null constraints
*/

-- Add username column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    ALTER TABLE users ADD COLUMN username text;
  END IF;
END $$;

-- Update existing users to have a username if they don't have one
UPDATE users 
SET username = LOWER(REPLACE(name, ' ', '_')) || '_' || SUBSTRING(id::text, 1, 8)
WHERE username IS NULL OR username = '';

-- Make username NOT NULL after populating existing records
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'username' AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE users ALTER COLUMN username SET NOT NULL;
  END IF;
END $$;

-- Create unique index on username if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'users_username_key'
  ) THEN
    CREATE UNIQUE INDEX users_username_key ON users (username);
  END IF;
END $$;

-- Add search index for username if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'users' AND indexname = 'idx_users_username'
  ) THEN
    CREATE INDEX idx_users_username ON users (username);
  END IF;
END $$;